import { useRef } from 'react'

interface PinInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export function PinInput({ value, onChange, disabled }: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(4, ' ').split('').slice(0, 4)

  const handleChange = (index: number, raw: string) => {
    const char = raw.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char || ' '
    const joined = next.join('').trimEnd()
    onChange(joined)
    if (char && index < 3) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...digits]
      if (next[index].trim()) {
        next[index] = ' '
      } else if (index > 0) {
        next[index - 1] = ' '
        refs.current[index - 1]?.focus()
      }
      onChange(next.join('').trimEnd())
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 3) {
      refs.current[index + 1]?.focus()
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map(i => (
        <input
          key={i}
          ref={el => { refs.current[i] = el }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onFocus={e => e.target.select()}
          disabled={disabled}
          className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2
            border-army-300 bg-white text-army-900
            focus:outline-none focus:border-army-600 focus:ring-2 focus:ring-army-200
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
          autoComplete="off"
        />
      ))}
    </div>
  )
}
