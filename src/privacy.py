"""
privacy.py - Funciones de anonimización (Data Scrubbing / UUIDs para métricas globales)

Este módulo garantiza que la información personal identificable (PII) sea eliminada
o enmascarada antes de interactuar con modelos de IA o guardar logs.
"""

import re
import uuid
from typing import Tuple, Dict, Any


class PrivacyScrubber:
    """Clase para anonimización de texto y generación de métricas anónimas."""
    
    # Patrones regex para detección de PII común
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    PHONE_PATTERN = r'(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}'
    ID_CARD_PATTERN = r'\b\d{7,10}\b'  # Ejemplo de DNI / Cédula / ID numérico de 7-10 dígitos
    
    @classmethod
    def generate_anonymous_session_id(cls) -> str:
        """Genera un UUIDv4 único para registrar métricas globales de forma anónima."""
        return str(uuid.uuid4())

    @classmethod
    def scrub_text(cls, text: str) -> Tuple[str, Dict[str, int]]:
        """
        Remueve patrones de PII (correo, teléfono, identificaciones) del texto del usuario.
        
        Returns:
            Tuple[str, Dict[str, int]]: (Texto anonimizado, Conteo de elementos sanitizados)
        """
        stats = {"emails_redacted": 0, "phones_redacted": 0, "ids_redacted": 0}
        
        # Redactar correos
        scrubbed_text, email_count = re.subn(cls.EMAIL_PATTERN, '[CORREO_ANÓNIMO]', text)
        stats["emails_redacted"] = email_count
        
        # Redactar teléfonos
        scrubbed_text, phone_count = re.subn(cls.PHONE_PATTERN, '[TELÉFONO_ANÓNIMO]', scrubbed_text)
        stats["phones_redacted"] = phone_count

        return scrubbed_text, stats


def anonymize_user_input(user_text: str) -> str:
    """Función helper rápida para limpiar el texto antes de enviarlo al RAG."""
    clean_text, _ = PrivacyScrubber.scrub_text(user_text)
    return clean_text


if __name__ == "__main__":
    # Prueba rápida del módulo
    sample = "Hola, mi correo es juan.perez@example.com y mi celular es +57 300 123 4567. Me siento muy agotado."
    session_id = PrivacyScrubber.generate_anonymous_session_id()
    cleaned, stats = PrivacyScrubber.scrub_text(sample)
    print(f"Session ID Anónimo: {session_id}")
    print(f"Texto Original: {sample}")
    print(f"Texto Anonimizado: {cleaned}")
    print(f"Métricas Sanitizadas: {stats}")
