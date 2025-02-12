import { Spinner } from './Spinner'

export function IndeterminateLoader(props: IndeterminateLoader.Props) {
  const { title } = props
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-accentTint p-[6px] text-accent">
          <Spinner />
        </div>

        <div className="font-medium text-[18px] text-primary">{title}</div>
      </div>

      <div className="mt-1.5 text-[15px] leading-[20px]">
        <div className="text-primary">This will only take a few moments.</div>
        <div className="text-secondary">Please do not close the window.</div>
      </div>
    </div>
  )
}

export declare namespace IndeterminateLoader {
  type Props = {
    title: string
  }
}
