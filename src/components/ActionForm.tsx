'use client'

import { startTransition, useActionState, useEffect, useRef } from 'react'
import type { ActionState } from '@/lib/action'

type Props = {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>
  children: React.ReactNode
  className?: string
  resetOnOk?: boolean
  confirm?: string
}

// Form gọi Server Action và hiện kết quả. Tự gọi action (không dùng <form action>)
// để React không xóa dữ liệu người dùng đã nhập khi thao tác bị lỗi.
export function ActionForm({ action, children, className, resetOnOk, confirm }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const ref = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset()
  }, [state, resetOnOk])

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        if (confirm && !window.confirm(confirm)) return
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter)
        startTransition(() => formAction(fd))
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {state?.error && <p className="msg-error col-span-full">{state.error}</p>}
      {state?.ok && <p className="msg-ok col-span-full">{state.ok}</p>}
    </form>
  )
}
