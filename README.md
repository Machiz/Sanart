# Sanart - Sistema RAG para Detección y Prevención de Burnout

**Sanart** es un sistema RAG (Retrieval-Augmented Generation) diseñado para la detección temprana, evaluación diagnóstica y acompañamiento en la prevención del síndrome de Burnout y estrés laboral.

---

## 📁 Estructura del Proyecto

```text
Sanart/
├── app.py                       # Punto de entrada interactivo (Test de Burnout y RAG)
├── data/                        # Guías y documentos de referencia sobre salud mental y burnout
│   └── sample_burnout_guide.md
├── src/
│   ├── __init__.py
│   ├── ingest.py                # Script para procesar documentos y crear embeddings (Chroma DB)
│   ├── rag.py                   # Lógica del RAG, prompts del sistema y conexión con el LLM
│   ├── burnout_test.py          # Test rápido, preguntas y cálculo de puntajes (Umbrales Verde, Amarillo, Rojo)
│   └── privacy.py               # Funciones de anonimización (Data Scrubbing / UUIDs para métricas)
├── requirements.txt             # Dependencias del proyecto
└── .env.example                 # Plantilla de variables de entorno (API Keys)
```

---

## 🚀 Instalación y Uso

### 1. Instalación de Dependencias
```bash
pip install -r requirements.txt
```

### 2. Ingesta de Documentos
Para procesar los documentos de referencia en `data/` y generar la base de datos vectorial Chroma:
```bash
python -m src.ingest
```

### 3. Ejecución de la Aplicación
Inicia la consola interactiva:
```bash
python app.py
```

---

## 🔒 Privacidad y Sanitización de Datos
El módulo `src/privacy.py` se encarga de eliminar Información de Identificación Personal (PII) como correos electrónicos, números telefónicos y números de identificación antes de enviar el texto al modelo de lenguaje o a la base de datos de vectorización, garantizando el anonimato del usuario.