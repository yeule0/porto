import { Spinner } from './Spinner'

export function IndeterminateLoader(props: IndeterminateLoader.Props) {
  const { title } = props
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-blueA3 p-[6px] text-blue10">
          <Spinner />
        </div>

        <div className="font-medium text-[18px] text-gray12">{title}</div>
      </div>

      <div className="mt-1.5 text-[15px] leading-[20px]">
        <div className="text-gray12">This will only take a few moments.</div>
        <div className="text-gray9">Please do not close the window.</div>
      </div>
    </div>
  )
}

export declare namespace IndeterminateLoader {
  type Props = {
    title: string
  }
}
