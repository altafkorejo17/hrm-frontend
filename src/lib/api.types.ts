/** Standard NestJS response envelope — every endpoint returns this shape. */
export type ApiResponse<T = null> = {
  success: boolean
  statusCode: number
  message: string | string[]
  data: T
  timestamp: string
}

export type ApiErrorBody = {
  success: false
  statusCode: number
  message: string | string[]
  path: string
  timestamp: string
}

/** Reusable Server Action state — TFields constrains which fields can have errors. */
export type ActionState<TFields extends string = string> = {
  errors?: Partial<Record<TFields, string[]>>
  message?: string
  success?: boolean
}
