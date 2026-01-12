import * as React from "react"

import { cn } from "@/lib/utils"
import { BorderBeam } from "@/components/BorderBeam"
import { inputStyle } from "../styles"
interface TextareaProps extends React.ComponentProps<"textarea"> {
  glimmer?: boolean
}

function Textarea({ className, glimmer, ...props }: TextareaProps) {
  const textarea = (
    <textarea
      data-slot="textarea"
      className={cn(
        inputStyle({ glimmer }),
        "field-sizing-content min-h-16 rounded-md py-2",
        className
      )}
      {...props}
    />
  )

  return (
    <div className="relative rounded-lg">
      {textarea}
      {glimmer && (<>
        <BorderBeam />
        <BorderBeam initialOffset={50} />
      </>)}
    </div>
  )

}

export { Textarea }
