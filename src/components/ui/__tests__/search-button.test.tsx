import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { SearchButton } from "../search-button"

describe("SearchButton", () => {
  it("renders as a button initially", () => {
    render(<SearchButton />)
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument()
  })

  it("expands to show input when clicked", async () => {
    const user = userEvent.setup()
    render(<SearchButton placeholder="Search companies..." />)

    const button = screen.getByRole("button", { name: /search/i })
    await user.click(button)

    expect(
      screen.getByPlaceholderText("Search companies...")
    ).toBeInTheDocument()
  })

  it("calls onChange when typing", async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<SearchButton onChange={handleChange} />)

    const button = screen.getByRole("button", { name: /search/i })
    await user.click(button)

    const input = screen.getByRole("textbox")
    await user.type(input, "test")

    expect(handleChange).toHaveBeenCalledWith("test")
  })

  it("shows clear button when there is a value", async () => {
    const user = userEvent.setup()
    render(<SearchButton value="" />)

    const button = screen.getByRole("button", { name: /search/i })
    await user.click(button)

    const input = screen.getByRole("textbox")
    await user.type(input, "test")

    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument()
  })

  it("clears input when clear button is clicked", async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    const handleClear = jest.fn()
    render(
      <SearchButton
        value=""
        onChange={handleChange}
        onClear={handleClear}
      />
    )

    const button = screen.getByRole("button", { name: /search/i })
    await user.click(button)

    const input = screen.getByRole("textbox")
    await user.type(input, "test")

    const clearButton = screen.getByRole("button", { name: /clear/i })
    await user.click(clearButton)

    expect(handleClear).toHaveBeenCalled()
    expect(handleChange).toHaveBeenCalledWith("")
  })

  it("can be disabled", () => {
    render(<SearchButton disabled />)
    expect(screen.getByRole("button", { name: /search/i })).toBeDisabled()
  })

  it("supports different sizes", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<SearchButton size="sm" />)

    let button = screen.getByRole("button", { name: /search/i })
    expect(button).toHaveClass("h-6", "w-6")

    rerender(<SearchButton size="lg" />)
    button = screen.getByRole("button", { name: /search/i })
    expect(button).toHaveClass("h-10", "w-10")
  })

  it("auto-focuses input when expanded", async () => {
    const user = userEvent.setup()
    render(<SearchButton autoFocus />)

    const button = screen.getByRole("button", { name: /search/i })
    await user.click(button)

    const input = screen.getByRole("textbox")
    expect(input).toHaveFocus()
  })
})
