import uuid
import logging
from typing import List, Dict

from app.config import settings

logger = logging.getLogger(__name__)


class RAGService:
    def __init__(self):
        self.client = None
        self.embedder = None
        self.embedder_available = False
        self._init_chroma()
        self._init_embedder()

    def _init_chroma(self):
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
            logger.info("ChromaDB initialized.")
        except Exception as e:
            logger.warning(f"ChromaDB init failed: {e}")

    def _init_embedder(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
            self.embedder_available = True
            logger.info("Sentence Transformer embedder initialized.")
        except Exception as e:
            logger.warning(f"Embedder init failed: {e}. Using fallback.")

    def _get_collection(self, user_id):
        if not self.client:
            return None
        safe_id = str(user_id).replace("-", "_")
        collection_name = f"user_{safe_id}_knowledge"[:63]
        return self.client.get_or_create_collection(
            name=collection_name,
            metadata={"user_id": str(user_id)},
        )

    def _embed(self, text: str) -> List[float]:
        if self.embedder_available and self.embedder:
            return self.embedder.encode(text).tolist()
        # Deterministic fallback embedding (384-dim)
        import hashlib
        h = int(hashlib.md5(text.encode()).hexdigest(), 16)
        return [((h >> i) & 0xFF) / 255.0 for i in range(384)]

    def add_document(
        self,
        user_id,
        chunks: List[str],
        document_id: int,
        filename: str,
    ) -> List[str]:
        """Embed and store document chunks in ChromaDB. Returns list of chroma IDs."""
        collection = self._get_collection(user_id)
        if not collection or not chunks:
            return [f"fallback_{document_id}_{i}" for i in range(len(chunks))]

        chroma_ids, embeddings, documents, metadatas = [], [], [], []
        for i, chunk in enumerate(chunks):
            cid = f"doc_{document_id}_chunk_{i}_{uuid.uuid4().hex[:8]}"
            chroma_ids.append(cid)
            embeddings.append(self._embed(chunk))
            documents.append(chunk)
            metadatas.append(
                {
                    "document_id": str(document_id),
                    "filename": filename,
                    "chunk_index": str(i),
                    "user_id": str(user_id),
                }
            )

        try:
            collection.add(
                ids=chroma_ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
            )
        except Exception as e:
            logger.error(f"ChromaDB add error: {e}")

        return chroma_ids

    def search(self, user_id, query: str, n_results: int = 5) -> List[Dict]:
        """Semantic search over user's knowledge base."""
        collection = self._get_collection(user_id)
        if not collection:
            return []
        try:
            count = collection.count()
            if count == 0:
                return []
            results = collection.query(
                query_embeddings=[self._embed(query)],
                n_results=min(n_results, count),
            )
            docs = results.get("documents", [[]])[0]
            metas = results.get("metadatas", [[]])[0]
            dists = results.get("distances", [[0.0] * len(docs)])[0]
            return [
                {
                    "content": doc,
                    "filename": metas[i].get("filename", ""),
                    "distance": float(dists[i]),
                }
                for i, doc in enumerate(docs)
            ]
        except Exception as e:
            logger.error(f"ChromaDB search error: {e}")
            return []

    def delete_document(self, user_id, chroma_ids: List[str]):
        """Delete chunks from ChromaDB."""
        collection = self._get_collection(user_id)
        if not collection or not chroma_ids:
            return
        try:
            collection.delete(ids=chroma_ids)
        except Exception as e:
            logger.error(f"ChromaDB delete error: {e}")
