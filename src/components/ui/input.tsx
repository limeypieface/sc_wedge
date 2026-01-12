import * as React from "react"

import { cn } from "@/lib/utils"
import { BorderBeam } from "@/components/BorderBeam"
import { inputStyle } from "../styles"

interface InputProps extends React.ComponentProps<"input"> {
  glimmer?: boolean
}

function Input({ className, type, glimmer, ...props }: InputProps) {
  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn( inputStyle({ glimmer }), className )}
      {...props}
    />
  )

  return (
    <div className="relative rounded-lg w-full">
      {input}
      {glimmer && (<>
        <BorderBeam />
        <BorderBeam initialOffset={50} />
      </>)}
    </div>
  )
}

export { Input }
