import io
import logging
from typing import List

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    def extract_text(file_content: bytes, filename: str) -> str:
        """Extract text from PDF, DOCX, or TXT files."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else "txt"

        if ext == "pdf":
            return DocumentService._extract_pdf(file_content)
        elif ext == "docx":
            return DocumentService._extract_docx(file_content)
        elif ext in ("txt", "md", "text"):
            return file_content.decode("utf-8", errors="replace")
        else:
            # Attempt UTF-8 decode as fallback
            try:
                return file_content.decode("utf-8", errors="replace")
            except Exception:
                raise ValueError(f"Unsupported file type: .{ext}")

    @staticmethod
    def _extract_pdf(content: bytes) -> str:
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(content))
            pages = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n".join(pages).strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ValueError(f"Could not read PDF: {e}")

    @staticmethod
    def _extract_docx(content: bytes) -> str:
        try:
            import docx
            doc = docx.Document(io.BytesIO(content))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs).strip()
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            raise ValueError(f"Could not read DOCX: {e}")

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 400, overlap: int = 50) -> List[str]:
        """Split text into overlapping word-based chunks."""
        words = text.split()
        if not words:
            return []
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
            i += chunk_size - overlap
        return chunks
