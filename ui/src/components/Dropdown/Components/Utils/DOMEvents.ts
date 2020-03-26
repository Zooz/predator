export const setFocus = (element: HTMLElement): void => {
  if (element && element.focus) {
    element.focus()
  }
}
