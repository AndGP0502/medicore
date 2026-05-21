import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { chatWithAI, suggestDiagnosis, suggestTreatment } from '../../api/ai'
import toast from 'react-hot-toast'

const QUICK_ACTIONS = [
  { label: 'Sugerir diagnostico', icon: '??', type: 'diagnosis', placeholder: 'Describe los sintomas del paciente...' },
  { label: 'Sugerir tratamiento', icon: '??', type: 'treatment', placeholder: 'Ingresa el diagnostico...' },
  { label: 'Pregunta libre', icon: '??', type: 'chat', placeholder: 'Escribe tu pregunta medica...' },
]

function Message({ msg }) {
  return (
    <div style={{
      display: 'flex', gap: '0.75rem', marginBottom: '1rem',
      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
    }}>
      {msg.role === 'assistant' && (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
          ??
        </div>
      )}
      <div style={{
        maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: msg.role === 'user' ? 'linear-gradient(135deg, #0a3d6b, #0d5fa3)' : 'white',
        color: msg.role === 'user' ? 'white' : '#1a202c',
        border: msg.role === 'assistant' ? '1px solid #e8edf2' : 'none',
        fontSize: '0.875rem', lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
      {msg.role === 'user' && (
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8edf2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
          ?????
        </div>
      )}
    </div>
  )
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hola, soy tu asistente clinico IA. Puedo ayudarte a sugerir diagnosticos, tratamientos, y responder preguntas medicas. Como puedo ayudarte hoy?' }
  ])
  const [input, setInput] = useState('')
  const [activeAction, setActiveAction] = useState('chat')
  const [context, setContext] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const chatMutation = useMutation({
    mutationFn: (data) => {
      if (activeAction === 'diagnosis') return suggestDiagnosis(data)
      if (activeAction === 'treatment') return suggestTreatment({ diagnosis: data.message, patient_context: data.context })
      return chatWithAI(data)
    },
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }])
    },
    onError: () => toast.error('Error al conectar con el asistente IA'),
  })

  function handleSend() {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    const payload = activeAction === 'diagnosis'
      ? { symptoms: input, patient_context: context }
      : { message: input, context }
    chatMutation.mutate(payload)
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const currentAction = QUICK_ACTIONS.find(a => a.type === activeAction)

  return (
    <div style={{ fontFamily: "'Nunito','Segoe UI',sans-serif", height: 'calc(100vh - 3rem)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: '800', color: '#0a3d6b' }}>Asistente IA Clinico</h1>
        <p style={{ margin: 0, color: '#6b7c93', fontSize: '0.875rem' }}>Powered by Llama 3.2 ? funciona completamente offline</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem', flex: 1, minHeight: 0 }}>

        {/* Chat principal */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Acciones rapidas */}
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0f4f8', display: 'flex', gap: '0.5rem' }}>
            {QUICK_ACTIONS.map(action => (
              <button key={action.type} onClick={() => setActiveAction(action.type)}
                style={{
                  padding: '0.4rem 0.875rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                  background: activeAction === action.type ? 'linear-gradient(135deg, #0a3d6b, #0d5fa3)' : '#f0f4f8',
                  color: activeAction === action.type ? 'white' : '#6b7c93',
                }}>
                {action.icon} {action.label}
              </button>
            ))}
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {chatMutation.isPending && (
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>??</div>
                <div style={{ background: 'white', border: '1px solid #e8edf2', borderRadius: '18px 18px 18px 4px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                  Analizando... esto puede tomar unos segundos
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f0f4f8' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <textarea
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={currentAction?.placeholder}
                rows={2}
                style={{ flex: 1, padding: '0.65rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
              />
              <button onClick={handleSend} disabled={chatMutation.isPending || !input.trim()}
                style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #0a3d6b, #0d5fa3)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', opacity: chatMutation.isPending || !input.trim() ? 0.5 : 1 }}>
                Enviar
              </button>
            </div>
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>Enter para enviar ? Shift+Enter para nueva linea</p>
          </div>
        </div>

        {/* Panel lateral ? contexto del paciente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8edf2', padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contexto del paciente
            </h3>
            <textarea
              value={context} onChange={e => setContext(e.target.value)}
              placeholder="Pega aqui informacion del paciente: edad, sexo, antecedentes, alergias, medicamentos actuales..."
              rows={8}
              style={{ width: '100%', padding: '0.65rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#9ca3af' }}>Este contexto se enviara con cada pregunta</p>
          </div>

          <div style={{ background: '#f0f7ff', borderRadius: '14px', border: '1px solid #bfdbfe', padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#0a3d6b', textTransform: 'uppercase' }}>
              Ejemplos de uso
            </h3>
            {[
              'Paciente con fiebre 38.5, tos seca y dolor de garganta hace 3 dias',
              'Sugerir tratamiento para hipertension arterial grado 1',
              'Cuales son las contraindicaciones del ibuprofeno en adultos mayores?',
            ].map((ex, i) => (
              <button key={i} onClick={() => setInput(ex)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', marginBottom: '0.4rem', background: 'white', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.78rem', color: '#0a3d6b', cursor: 'pointer', fontFamily: 'inherit' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
