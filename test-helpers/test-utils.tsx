import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// カスタムrender関数（将来的にProviderを追加する場合に備えて）
export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options)
}

// re-export everything
export * from '@testing-library/react'
export { customRender as render }