from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.document_service import DocumentService
from app.services.rag_service import RAGService
from app.config import settings

router = APIRouter()
rag_service = RAGService()


@router.post("/upload", response_model=schemas.KnowledgeDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Upload a document (PDF, DOCX, TXT, MD).
    Extracts text, chunks it, embeds chunks in ChromaDB, and stores metadata in DB.
    """
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE // 1024 // 1024} MB",
        )

    filename = file.filename or "uploaded_file"
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"

    # Extract text
    try:
        text = DocumentService.extract_text(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract any text from the document",
        )

    # Chunk text
    chunks = DocumentService.chunk_text(text)

    # Save document record first to get ID
    doc = models.KnowledgeDocument(
        user_id=current_user.id,
        filename=filename,
        file_type=ext,
        content=text[:5000],  # Store first 5000 chars as preview
        chunk_count=len(chunks),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Add to ChromaDB
    chroma_ids = rag_service.add_document(
        user_id=current_user.id,
        chunks=chunks,
        document_id=doc.id,
        filename=filename,
    )

    # Store chunk records in DB
    for i, (chunk_text, chroma_id) in enumerate(zip(chunks, chroma_ids)):
        chunk = models.DocumentChunk(
            document_id=doc.id,
            chunk_index=i,
            content=chunk_text[:1000],  # Store first 1000 chars per chunk
            chroma_id=chroma_id,
        )
        db.add(chunk)

    db.commit()
    db.refresh(doc)
    return doc


@router.get("", response_model=List[schemas.KnowledgeDocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all knowledge base documents for the current user."""
    documents = (
        db.query(models.KnowledgeDocument)
        .filter(models.KnowledgeDocument.user_id == current_user.id)
        .order_by(models.KnowledgeDocument.created_at.desc())
        .all()
    )
    return documents


@router.post("/search")
def search_knowledge(
    request: schemas.KnowledgeSearchRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Perform semantic search over the user's knowledge base."""
    if not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty",
        )

    results = rag_service.search(
        user_id=current_user.id,
        query=request.query,
        n_results=request.n_results,
    )

    # Fallback to database chunk search if ChromaDB is empty or unavailable
    if not results:
        query_text = request.query.strip().lower()
        query_words = [w for w in query_text.split() if len(w) > 1]
        if not query_words:
            query_words = [query_text]

        user_docs = (
            db.query(models.KnowledgeDocument)
            .filter(models.KnowledgeDocument.user_id == current_user.id)
            .all()
        )
        doc_map = {d.id: d.filename for d in user_docs}

        if doc_map:
            chunks = (
                db.query(models.DocumentChunk)
                .filter(models.DocumentChunk.document_id.in_(list(doc_map.keys())))
                .all()
            )
            scored = []
            for chunk in chunks:
                if not chunk.content:
                    continue
                content_lower = chunk.content.lower()
                term_matches = sum(1 for term in query_words if term in content_lower)
                exact_match = 2 if query_text in content_lower else 0
                score = term_matches + exact_match
                if score > 0:
                    dist = max(0.05, round(1.0 - (score * 0.2), 2))
                    scored.append({
                        "content": chunk.content,
                        "filename": doc_map.get(chunk.document_id, "Document"),
                        "distance": dist,
                        "_score": score,
                    })
            scored.sort(key=lambda x: x["_score"], reverse=True)
            results = [{k: v for k, v in item.items() if k != "_score"} for item in scored[:request.n_results]]

    return {"results": results, "query": request.query, "total": len(results)}


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a document and its ChromaDB embeddings."""
    doc = (
        db.query(models.KnowledgeDocument)
        .filter(
            models.KnowledgeDocument.id == document_id,
            models.KnowledgeDocument.user_id == current_user.id,
        )
        .first()
    )
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Collect chroma IDs before deleting
    chroma_ids = [chunk.chroma_id for chunk in doc.chunks if chunk.chroma_id]

    # Delete from ChromaDB
    if chroma_ids:
        rag_service.delete_document(user_id=current_user.id, chroma_ids=chroma_ids)

    # Delete from DB (cascades to chunks)
    db.delete(doc)
    db.commit()
    return None
