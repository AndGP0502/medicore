import requests
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2"

SYSTEM_PROMPT = """Eres un asistente clinico medico especializado integrado en el sistema MediCore.
Tu funcion es ayudar a los medicos durante las consultas.
Puedes:
- Sugerir diagnosticos basados en sintomas (incluye codigos CIE-10)
- Sugerir tratamientos y medicamentos con dosis
- Redactar recetas medicas
- Resumir historias clinicas
- Responder preguntas medicas en espanol

Responde siempre en espanol, de forma clara, concisa y profesional.
Nunca inventes informacion. Si no sabes algo, dilo claramente.
Recuerda que el medico tiene la decision final."""


class AIAssistantService:
    def chat(self, message: str, context: str = "") -> str:
        prompt = f"{SYSTEM_PROMPT}\n\n"
        if context:
            prompt += f"Contexto del paciente:\n{context}\n\n"
        prompt += f"Medico pregunta: {message}\n\nRespuesta:"

        try:
            response = requests.post(OLLAMA_URL, json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                }
            }, timeout=120)
            data = response.json()
            return data.get("response", "Error al obtener respuesta")
        except requests.exceptions.ConnectionError:
            return "Error: Ollama no esta corriendo. Ejecuta 'ollama serve' en una terminal."
        except Exception as e:
            return f"Error: {str(e)}"

    def suggest_diagnosis(self, symptoms: str, patient_context: str = "") -> str:
        message = f"""Basandote en estos sintomas: {symptoms}
        
Sugiere los diagnosticos mas probables con:
1. Nombre del diagnostico
2. Codigo CIE-10
3. Probabilidad (alta/media/baja)
4. Examenes recomendados

Formato tu respuesta de manera clara y estructurada."""
        return self.chat(message, patient_context)

    def suggest_treatment(self, diagnosis: str, patient_context: str = "") -> str:
        message = f"""Para el diagnostico: {diagnosis}

Sugiere el tratamiento incluyendo:
1. Medicamentos (nombre generico, dosis, frecuencia, duracion)
2. Indicaciones generales
3. Contraindicaciones importantes
4. Seguimiento recomendado"""
        return self.chat(message, patient_context)

    def summarize_history(self, records: list) -> str:
        records_text = "\n".join([
            f"- Fecha: {r.get('date', 'N/A')}, Motivo: {r.get('chief_complaint', 'N/A')}, Diagnostico: {r.get('diagnosis', 'N/A')}"
            for r in records
        ])
        message = f"""Resume esta historia clinica del paciente de forma concisa:

{records_text}

Incluye: patologias cronicas identificadas, medicamentos frecuentes, alergias mencionadas, y observaciones importantes."""
        return self.chat(message)


ai_service = AIAssistantService()
