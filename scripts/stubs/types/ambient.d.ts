// ============================================================================
// Ambient module stubs for the adonisjs-7-deterministic snippet typechecker.
//
// These stubs are intentionally minimal: they declare only the surface the
// canonical snippets actually touch, and they tighten the doctrine-critical
// APIs (generated controllers barrel names, Link/Form routeParams prop,
// vine.create root schema, BaseInertiaMiddleware base class, BaseTransformer
// shape). Everything else is loose on purpose — we do not simulate the full
// AdonisJS ecosystem.
//
// If a legitimate snippet fails to typecheck because a surface is missing,
// extend the relevant module stub here — do NOT relax the critical ones.
// ============================================================================

// ---------------------------------------------------------------------------
// Luxon
// ---------------------------------------------------------------------------
declare module 'luxon' {
  export class DateTime {
    static now(): DateTime
    static local(): DateTime
    static fromISO(iso: string): DateTime
    toISO(): string
    toFormat(fmt: string): string
    plus(duration: Record<string, number>): DateTime
    minus(duration: Record<string, number>): DateTime
  }
}

// ---------------------------------------------------------------------------
// @vinejs/vine — TIGHT: vine.create is the canonical v7 root API.
// Using vine.compile(vine.object(...)) as the root must fail typecheck.
// ---------------------------------------------------------------------------
declare module '@vinejs/vine' {
  interface VineAPI {
    create(fields: Record<string, unknown>): unknown
    object(fields: Record<string, unknown>): unknown
    string(): VineChain
    number(): VineChain
    boolean(): VineChain
    date(): VineChain
    file(opts?: { size?: string; extnames?: readonly string[] }): VineChain
    enum<T extends readonly string[]>(values: T): VineChain
    array(schema: unknown): VineChain
    withMetaData<M>(): {
      create(fields: Record<string, unknown>): unknown
    }
  }
  interface VineChain {
    trim(): VineChain
    minLength(n: number): VineChain
    maxLength(n: number): VineChain
    url(): VineChain
    email(): VineChain
    unique(opts: unknown): VineChain
    positive(): VineChain
    negative(): VineChain
    withoutDecimals(): VineChain
    range(range: readonly [number, number]): VineChain
    optional(): VineChain
    nullable(): VineChain
    confirmed(): VineChain
  }
  const vine: VineAPI
  export default vine
}

// ---------------------------------------------------------------------------
// @adonisjs/core — top-level re-exports
// ---------------------------------------------------------------------------
declare module '@adonisjs/core' {
  export function inject(): ClassDecorator
  export function indexEntities(opts?: {
    transformers?: { enabled?: boolean; withSharedProps?: boolean }
  }): unknown
}

declare module '@adonisjs/core/app' {
  export function defineConfig(config: {
    hooks?: {
      init?: readonly unknown[]
      buildStarting?: readonly unknown[]
    }
  }): unknown
}

declare module '@adonisjs/core/http' {
  // `validateUsing` returns a permissive shape here so that snippet
  // destructuring (e.g. `const { email, password, remember } = ...`) stays
  // legal without requiring a per-validator Infer<> wiring in the stubs.
  // The snippet validator enforces `no-any` at the doctrine level — this
  // stub relaxation is scoped to the typecheck harness only.
  // eslint-disable-next-line
  type ValidatedPayload = { [key: string]: any }
  export interface HttpContext {
    request: {
      validateUsing<T>(validator: T, options?: unknown): Promise<ValidatedPayload>
      input(name: string, defaultValue?: unknown): unknown
    }
    response: {
      status(code: number): void
      json(body: unknown): unknown
      redirect(): {
        toRoute(name: string, params?: Record<string, unknown>): unknown
        back(): unknown
      }
      forbidden(body?: unknown): unknown
      notFound(body?: unknown): unknown
      created(body?: unknown): unknown
      ok(body?: unknown): unknown
      badRequest(body?: unknown): unknown
      unprocessableEntity(body?: unknown): unknown
      conflict(body?: unknown): unknown
      accepted(body?: unknown): unknown
      send(body: unknown): unknown
      getBody(): unknown
      getStatus(): number
    }
    params: Record<string, string>
    session: {
      flash(key: string, value: unknown): void
      flashMessages: {
        get(key: string): string | undefined
      }
    }
    auth: {
      user?: { id: number | string; [key: string]: unknown }
      use(guard: 'web' | 'api'): {
        login(user: unknown, rememberMe?: boolean): Promise<unknown>
        logout(): Promise<unknown>
        createToken(
          user: unknown,
          abilities?: readonly string[],
          opts?: { expiresIn?: string }
        ): Promise<{ value: { release(): string } | null }>
      }
      getUserOrFail(): { id: number | string; [key: string]: unknown }
    }
    bouncer: {
      with(policy: unknown): {
        allows(ability: string, ...args: unknown[]): Promise<boolean>
        denies(ability: string, ...args: unknown[]): Promise<boolean>
      }
    }
    inertia: {
      render(page: string, props?: Record<string, unknown>): unknown
      always<T>(value: T | (() => T)): T
    }
    logger: {
      info(msg: string): void
      warn(msg: string): void
      error(msg: string): void
    }
    serialize(value: unknown): unknown
  }
  export function serialize(value: unknown): unknown
}

declare module '@adonisjs/core/services/router' {
  interface RouteBuilder {
    as(name: string): RouteBuilder
    use(middleware: unknown): RouteBuilder
    where(param: string, matcher: unknown): RouteBuilder
  }
  interface ResourceBuilder extends RouteBuilder {
    apiOnly(): ResourceBuilder
  }
  interface GroupBuilder extends RouteBuilder {
    prefix(path: string): GroupBuilder
  }
  const router: {
    get(pattern: string, handler: unknown): RouteBuilder
    post(pattern: string, handler: unknown): RouteBuilder
    put(pattern: string, handler: unknown): RouteBuilder
    patch(pattern: string, handler: unknown): RouteBuilder
    delete(pattern: string, handler: unknown): RouteBuilder
    resource(name: string, controller: unknown): ResourceBuilder
    group(fn: () => void): GroupBuilder
    on(pattern: string): {
      render(view: string, data?: unknown): RouteBuilder
      redirect(target: string): RouteBuilder
      redirectToRoute(name: string): RouteBuilder
      renderInertia(component: string, props?: Record<string, unknown>): RouteBuilder
    }
    named(middleware: Record<string, () => Promise<unknown>>): Record<string, (...args: unknown[]) => unknown>
    matchers: {
      number(): unknown
      uuid(): unknown
      slug(): unknown
    }
  }
  export default router
}

declare module '@adonisjs/core/services/config' {
  const config: {
    get<T = unknown>(key: string): T
  }
  export default config
}

declare module '@adonisjs/core/services/app' {
  const app: {
    inProduction: boolean
    inDev: boolean
    inTest: boolean
  }
  export default app
}

declare module '@adonisjs/core/transformers' {
  export class BaseTransformer<TResource> {
    protected resource: TResource
    protected pick<K extends keyof TResource>(
      resource: TResource,
      keys: readonly K[]
    ): Pick<TResource, K>
    toObject(): unknown
    static transform<T>(resource: T | readonly T[]): unknown
    static paginate<T>(rows: readonly T[], meta: unknown): unknown
  }
}

declare module '@adonisjs/core/types/http' {
  import type { HttpContext } from '@adonisjs/core/http'
  export type NextFn = () => Promise<unknown>
  export { HttpContext }
}

declare module '@adonisjs/core/types/transformers' {
  export type InferData<T> = unknown
  export type InferVariants<T> = Record<string, unknown>
}

declare module '@adonisjs/core/ace' {
  export class BaseCommand {
    static commandName: string
    static description: string
    logger: {
      info(msg: string): void
      warning(msg: string): void
      success(msg: string): void
      await(msg: string): { update(msg: string): void; stop(): void }
    }
    run(): Promise<void>
  }
  export const args: {
    string(opts: { description: string }): PropertyDecorator
  }
  export const flags: {
    boolean(opts: { alias?: string; description: string }): PropertyDecorator
    number(opts: { description: string }): PropertyDecorator
  }
}

declare module '@adonisjs/core/types/ace' {
  export interface CommandOptions {
    startApp?: boolean
  }
}

// ---------------------------------------------------------------------------
// @adonisjs/auth
// ---------------------------------------------------------------------------
declare module '@adonisjs/auth' {
  export function defineConfig(config: unknown): unknown
}

declare module '@adonisjs/auth/session' {
  export function sessionGuard(opts: {
    useRememberMeTokens?: boolean
    rememberMeTokensAge?: string
    provider: unknown
  }): unknown
  export function sessionUserProvider(opts: { model: () => Promise<unknown> }): unknown
}

declare module '@adonisjs/auth/access_tokens' {
  export class DbAccessTokensProvider {
    static forModel(model: unknown, opts: { expiresIn: string }): unknown
  }
}

declare module '@adonisjs/auth/types' {
  export interface Authenticators {
    web: unknown
    api: unknown
  }
}

// ---------------------------------------------------------------------------
// @adonisjs/bouncer
// ---------------------------------------------------------------------------
declare module '@adonisjs/bouncer' {
  export function indexPolicies(): unknown
}

// ---------------------------------------------------------------------------
// @adonisjs/session
// ---------------------------------------------------------------------------
declare module '@adonisjs/session' {
  export function defineConfig(config: unknown): unknown
}

// ---------------------------------------------------------------------------
// @adonisjs/shield
// ---------------------------------------------------------------------------
declare module '@adonisjs/shield' {
  export function defineConfig(config: unknown): unknown
}

// ---------------------------------------------------------------------------
// @adonisjs/inertia — TIGHT for Link/Form routeParams, loose elsewhere
// ---------------------------------------------------------------------------
declare module '@adonisjs/inertia' {
  export function defineConfig(config: unknown): unknown
  export function indexPages(opts: { framework: string }): unknown
}

declare module '@adonisjs/inertia/inertia_middleware' {
  import type { HttpContext } from '@adonisjs/core/http'
  import type { NextFn } from '@adonisjs/core/types/http'
  export default class BaseInertiaMiddleware {
    init(ctx: HttpContext): Promise<void>
    dispose(ctx: HttpContext): void
    getValidationErrors(ctx: HttpContext): Record<string, string>
    handle(ctx: HttpContext, next: NextFn): Promise<unknown>
  }
}

declare module '@adonisjs/inertia/types' {
  export type InertiaProps<T = Record<string, unknown>> = T & {
    user?: unknown
    flash?: { success?: string; error?: string }
    errors?: Record<string, string>
    app?: { name: string; env: string }
  }
  export type InferSharedProps<T> = Record<string, unknown>
  export interface SharedProps {
    user?: unknown
    flash?: { success?: string; error?: string }
    errors?: Record<string, string>
    app?: { name: string; env: string }
  }
}

// TIGHT: Link and Form accept `routeParams`, NOT `params`.
// Dropping this precision would silently accept the v6-style prop.
declare module '@adonisjs/inertia/react' {
  import type { ReactNode, FC } from 'react'
  export interface LinkProps {
    route: string
    routeParams?: Record<string, unknown>
    className?: string
    children?: ReactNode
    download?: boolean | string
    target?: string
  }
  export interface FormProps {
    route: string
    routeParams?: Record<string, unknown>
    children?:
      | ((state: { errors: Record<string, string>; processing?: boolean }) => ReactNode)
      | ReactNode
  }
  export const Link: FC<LinkProps>
  export const Form: FC<FormProps>
}

// ---------------------------------------------------------------------------
// @adonisjs/lucid
// ---------------------------------------------------------------------------
declare module '@adonisjs/lucid/orm' {
  import type { DateTime } from 'luxon'
  export class BaseModel {
    static table: string
    static query(): QueryBuilder<BaseModel>
    static findOrFail<T extends BaseModel>(this: new () => T, id: number | string): Promise<T>
    static find<T extends BaseModel>(this: new () => T, id: number | string): Promise<T | null>
    static all<T extends BaseModel>(this: new () => T): Promise<T[]>
    static create<T extends BaseModel>(this: new () => T, payload: Record<string, unknown>): Promise<T>
    merge(payload: Record<string, unknown>): this
    save(): Promise<this>
    delete(): Promise<void>
  }
  interface QueryBuilder<T> {
    where(column: string, value: unknown): QueryBuilder<T>
    where(column: string, op: string, value: unknown): QueryBuilder<T>
    whereILike(column: string, pattern: string): QueryBuilder<T>
    whereNot(column: string, value: unknown): QueryBuilder<T>
    whereNotNull(column: string): QueryBuilder<T>
    orWhere(column: string, op: string, value: unknown): QueryBuilder<T>
    orderBy(column: string, direction?: 'asc' | 'desc'): QueryBuilder<T>
    limit(n: number): QueryBuilder<T>
    paginate(page: number, perPage: number): Promise<Paginator<T>>
    preload(relation: string): QueryBuilder<T>
    withCount(relation: string): QueryBuilder<T>
    exec(): Promise<T[]>
    first(): Promise<T | null>
    firstOrFail(): Promise<T>
  }
  interface Paginator<T> {
    all(): T[]
    getMeta(): unknown
  }
  export function column(opts?: { isPrimary?: boolean; columnName?: string }): PropertyDecorator
  export namespace column {
    function dateTime(opts?: {
      autoCreate?: boolean
      autoUpdate?: boolean
    }): PropertyDecorator
  }
  export function belongsTo(related: () => unknown): PropertyDecorator
  export function hasMany(related: () => unknown): PropertyDecorator
  export function hasOne(related: () => unknown): PropertyDecorator
}

declare module '@adonisjs/lucid/schema' {
  export class BaseSchema {
    protected tableName: string
    protected schema: {
      createTable(
        name: string,
        callback: (table: {
          increments(name: string): unknown
          string(name: string): { notNullable(): unknown; defaultTo(value: unknown): unknown }
          text(name: string): { notNullable(): unknown }
          timestamp(name: string): unknown
          integer(name: string): unknown
        }) => void
      ): unknown
      dropTable(name: string): unknown
    }
    up(): Promise<void>
    down(): Promise<void>
  }
}

declare module '@adonisjs/lucid/services/db' {
  const db: {
    transaction<T>(callback: (trx: unknown) => Promise<T>): Promise<T>
  }
  export default db
}

declare module '@adonisjs/lucid/types/relations' {
  export type BelongsTo<T> = unknown
  export type HasMany<T> = unknown
  export type HasOne<T> = unknown
}

// ---------------------------------------------------------------------------
// @adonisjs/mail + @adonisjs/drive
// ---------------------------------------------------------------------------
declare module '@adonisjs/mail/services/main' {
  const mail: {
    send(builder: unknown): Promise<unknown>
    sendLater(notification: unknown): Promise<unknown>
    fake(): { assertSent(cls: unknown): void }
    restore(): void
  }
  export default mail
}

declare module '@adonisjs/drive/services/main' {
  const drive: {
    use(disk?: string): {
      put(key: string, contents: unknown): Promise<void>
      get(key: string): Promise<string>
      exists(key: string): Promise<boolean>
      delete(key: string): Promise<void>
      getUrl(key: string): Promise<string>
      getSignedUrl(key: string, opts?: { expiresIn?: string }): Promise<string>
    }
    fake(): unknown
    restore(): void
  }
  export default drive
}

// ---------------------------------------------------------------------------
// Tuyau
// ---------------------------------------------------------------------------
declare module '@tuyau/core/client' {
  export function createTuyau(opts: {
    baseUrl: string
    registry: unknown
  }): {
    urlFor(route: string, params?: Record<string, unknown>): string
    [routeName: string]: unknown
  }
}

declare module '@tuyau/core/hooks' {
  export function generateRegistry(): unknown
}

declare module '@tuyau/react-query' {
  export function createTuyauReactQueryClient(opts: { client: unknown }): unknown
}

// ---------------------------------------------------------------------------
// @inertiajs/react
// ---------------------------------------------------------------------------
declare module '@inertiajs/react' {
  import type { FC, ReactNode } from 'react'
  export const Head: FC<{ title?: string; children?: ReactNode }>
  export const router: {
    visit(url: string, opts?: unknown): void
    get(url: string): void
    post(url: string, data?: unknown): void
    reload(opts?: unknown): void
  }
  export function useRemember<T>(initial: T, key?: string): [T, (value: T) => void]
  export function usePage<T = Record<string, unknown>>(): { props: T; url: string }
  export function createInertiaApp(opts: {
    progress?: { color: string }
    resolve: (name: string) => Promise<unknown>
    setup: (args: {
      el: HTMLElement
      App: FC<Record<string, unknown>>
      props: Record<string, unknown>
    }) => void
  }): void
}

// ---------------------------------------------------------------------------
// Mantine
// ---------------------------------------------------------------------------
declare module '@mantine/core' {
  import type { FC, ReactNode } from 'react'
  type MantineComponent = FC<Record<string, unknown> & { children?: ReactNode }>
  export const Button: MantineComponent
  export const Card: MantineComponent
  export const Stack: MantineComponent
  export const Group: MantineComponent
  export const Title: MantineComponent
  export const TextInput: MantineComponent
  export const Textarea: MantineComponent
  export const Select: MantineComponent
  export const Badge: MantineComponent
  export const Text: MantineComponent
  export const Paper: MantineComponent
  export const Container: MantineComponent
  export const MantineProvider: FC<{ theme?: unknown; children?: ReactNode }>
  export function createTheme(config: Record<string, unknown>): unknown
}

declare module '@mantine/core/styles.css' {}
declare module '@mantine/notifications/styles.css' {}
declare module '@mantine/dates/styles.css' {}

declare module '@mantine/notifications' {
  import type { FC } from 'react'
  export const Notifications: FC<Record<string, unknown>>
  export const notifications: {
    show(opts: { color?: string; message: string; title?: string }): void
    hide(id: string): void
  }
}

declare module '@mantine/dates' {
  import type { FC } from 'react'
  type DateComponent = FC<Record<string, unknown>>
  export const DatePickerInput: DateComponent
  export const DateInput: DateComponent
  export const Calendar: DateComponent
}

declare module '@mantine/hooks' {
  export function useDisclosure(
    initial?: boolean
  ): [boolean, { open(): void; close(): void; toggle(): void }]
  export function useDebouncedValue<T>(value: T, wait: number): [T, { flush(): void }]
}

declare module '@tabler/icons-react' {
  import type { FC } from 'react'
  type Icon = FC<{ size?: number | string; stroke?: number | string; color?: string }>
  export const IconPlus: Icon
  export const IconEye: Icon
  export const IconEdit: Icon
  export const IconTrash: Icon
  export const IconCheck: Icon
  export const IconX: Icon
  export const IconSearch: Icon
  export const IconDownload: Icon
  export const IconUpload: Icon
  export const IconHome: Icon
  export const IconUser: Icon
  export const IconSettings: Icon
}

// ---------------------------------------------------------------------------
// React / react-dom
// ---------------------------------------------------------------------------
declare module 'react' {
  export type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | ReactElement
    | ReactNode[]
  export interface ReactElement {
    type: unknown
    props: Record<string, unknown>
    key: string | number | null
  }
  export type FC<P = Record<string, unknown>> = (props: P) => ReactElement | null
  export type PropsWithChildren<P = Record<string, unknown>> = P & { children?: ReactNode }
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void]
  export function useRef<T>(initial: T): { current: T }
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T
  export function useCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    deps: readonly unknown[]
  ): T
  export function useReducer<S, A>(
    reducer: (state: S, action: A) => S,
    initial: S
  ): [S, (action: A) => void]
}

declare module 'react/jsx-runtime' {
  export function jsx(type: unknown, props: unknown, key?: string): unknown
  export function jsxs(type: unknown, props: unknown, key?: string): unknown
  export const Fragment: unique symbol
}

declare module 'react-dom/client' {
  export function createRoot(container: HTMLElement | null): {
    render(node: unknown): void
    unmount(): void
  }
}

// ---------------------------------------------------------------------------
// Zustand
// ---------------------------------------------------------------------------
declare module 'zustand' {
  export function create<T>(
    initializer: (set: (partial: Partial<T> | ((state: T) => Partial<T>)) => void, get: () => T) => T
  ): () => T
}

// ---------------------------------------------------------------------------
// TanStack Query + Table
// ---------------------------------------------------------------------------
declare module '@tanstack/react-query' {
  import type { FC, ReactNode } from 'react'
  export class QueryClient {
    constructor(opts?: {
      defaultOptions?: {
        queries?: {
          retry?: number
          refetchOnWindowFocus?: boolean
          staleTime?: number
        }
      }
    })
  }
  export const QueryClientProvider: FC<{ client: QueryClient; children?: ReactNode }>
  export function useQuery(options: unknown): { data: unknown; isLoading: boolean; error: unknown }
  export function useMutation(options: unknown): unknown
}

declare module '@tanstack/react-table' {
  export function useReactTable<T>(opts: {
    data: readonly T[]
    columns: readonly unknown[]
    getCoreRowModel: () => unknown
  }): unknown
  export function getCoreRowModel(): () => unknown
}

// ---------------------------------------------------------------------------
// #generated/controllers — TIGHT: only the canonical PascalCase barrel names.
// Using `controllers.PostsController` (with the Controller suffix) must fail.
// Add new entries here as snippets introduce new controllers.
// ---------------------------------------------------------------------------
declare module '#generated/controllers' {
  export const controllers: {
    Posts: unknown
    ApiPosts: unknown
    Session: unknown
    PostPublish: unknown
    ApiPostSearch: unknown
    ApiTokens: unknown
    Users: unknown
    Comments: unknown
  }
}

// ---------------------------------------------------------------------------
// @generated/data — exposed by indexEntities({ transformers: { enabled: true } })
// ---------------------------------------------------------------------------
declare module '@generated/data' {
  export namespace Data {
    export type Post = {
      id: number
      title: string
      url?: string
      summary?: string
      body?: string
      slug?: string
      createdAt?: string
      updatedAt?: string
      author?: { id: number; fullName: string }
      comments?: readonly Comment[]
      can?: { edit?: boolean; delete?: boolean; publish?: boolean }
    }
    export namespace Post {
      export type Variants = {
        forDetailedView: Post
        forList: Post
        [variant: string]: Post
      }
    }
    export type User = {
      id: number
      fullName: string
      email: string
    }
    export type Comment = {
      id: number
      content: string
      author: { id: number; fullName: string }
      createdAt?: string
    }
  }
}

// ---------------------------------------------------------------------------
// @generated/registry — produced by @tuyau/core generateRegistry hook
// ---------------------------------------------------------------------------
declare module '@generated/registry' {
  export const registry: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// ~/types — per-project InertiaProps type helper (loose re-export)
// ---------------------------------------------------------------------------
declare module '~/types' {
  export type InertiaProps<T = Record<string, unknown>> = T & {
    user?: unknown
    flash?: { success?: string; error?: string }
    errors?: Record<string, string>
    app?: { name: string; env: string }
  }
}

// ---------------------------------------------------------------------------
// ~/client — per-project Tuyau client re-export (loose)
// ---------------------------------------------------------------------------
declare module '~/client' {
  export const client: Record<string, unknown>
  export function urlFor(route: string, params?: Record<string, unknown>): string
  export const queryClient: unknown
  export const api: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// #models/* — per-project Lucid models (loose)
// ---------------------------------------------------------------------------
declare module '#models/user' {
  import { BaseModel } from '@adonisjs/lucid/orm'
  export default class User extends BaseModel {
    id: number
    email: string
    fullName: string
    static verifyCredentials(email: string, password: string): Promise<User>
    static accessTokens: unknown
  }
}

declare module '#models/post' {
  import { BaseModel } from '@adonisjs/lucid/orm'
  export default class Post extends BaseModel {
    id: number
    title: string
    body?: string
    slug?: string
    createdAt: unknown
    updatedAt: unknown
  }
}

// ---------------------------------------------------------------------------
// #validators/* — project validators (loose)
// ---------------------------------------------------------------------------
declare module '#validators/post' {
  export const createPostValidator: unknown
  export const updatePostValidator: unknown
  export const listPostsValidator: unknown
}

declare module '#validators/auth' {
  export const loginValidator: unknown
  export const issueApiTokenValidator: unknown
}

declare module '#validators/user' {
  export const showUserValidator: unknown
  export const updateUserValidator: unknown
  export const updateAvatarValidator: unknown
}

// ---------------------------------------------------------------------------
// #services/*, #policies/*, #transformers/*, #middleware/* — project modules (loose)
// ---------------------------------------------------------------------------
declare module '#services/payment_service' {
  export default class PaymentService {
    charge(orderId: number, amount: number, currency: string): Promise<void>
  }
}

declare module '#services/post_service' {
  // `list` returns a paginator-shaped result so snippets can call
  // `.all()` and `.getMeta()` on it (see references/patterns/api-resource.md).
  // Services in real projects also support an unpaginated variant — the stub
  // lies in favor of the canonical paginated case.
  interface PaginatedResult<T = unknown> {
    all(): T[]
    getMeta(): unknown
  }
  export default class PostService {
    list(filters?: Record<string, unknown>): Promise<PaginatedResult>
    findOrFail(id: number | string): Promise<unknown>
    create(payload: Record<string, unknown>): Promise<{ id: number }>
    update(id: number | string, payload: Record<string, unknown>): Promise<unknown>
    delete(model: unknown): Promise<void>
  }
}

declare module '#policies/post_policy' {
  export default class PostPolicy {}
}

declare module '#transformers/post_transformer' {
  import { BaseTransformer } from '@adonisjs/core/transformers'
  export default class PostTransformer extends BaseTransformer<unknown> {}
}

declare module '#transformers/user_transformer' {
  import { BaseTransformer } from '@adonisjs/core/transformers'
  export default class UserTransformer extends BaseTransformer<unknown> {}
}

declare module '#start/env' {
  const env: {
    get(key: string, defaultValue?: string): string
  }
  export default env
}

declare module '#start/kernel' {
  export const middleware: {
    auth(opts?: { guards?: readonly string[] }): unknown
    guest(): unknown
    authorize(opts: unknown): unknown
  }
}

// ---------------------------------------------------------------------------
// Miscellaneous project-relative imports used in snippets
// ---------------------------------------------------------------------------
declare module './theme' {
  export const theme: unknown
}

declare module '../../database/schema.js' {
  import { BaseModel } from '@adonisjs/lucid/orm'
  export class PostsSchema extends BaseModel {
    id: number
    title: string
    content: string
    status: string
  }
}

// ---------------------------------------------------------------------------
// CSS imports — side-effect imports (core/styles.css) and CSS Modules
// (*.module.css). CSS Modules return an object with string keys so that
// `classes.card`, `classes.root` etc. typecheck in the snippets.
// ---------------------------------------------------------------------------
declare module '*.css' {
  const classes: Record<string, string>
  export default classes
}

// ---------------------------------------------------------------------------
// @adonisjs/queue
// ---------------------------------------------------------------------------
declare module '@adonisjs/queue' {
  export class Job<TPayload> {
    payload: TPayload
    execute(): Promise<void>
    static options: { queue?: string; maxRetries?: number }
    static dispatch<T>(payload: T): {
      toQueue(name: string): unknown
      priority(n: number): unknown
      in(delay: string): unknown
      group(name: string): unknown
      with(adapter: string): unknown
    }
  }
  export function defineConfig(config: unknown): unknown
  export const drivers: {
    redis(opts: { connectionName: string }): unknown
    sync(): unknown
  }
}

declare module '@adonisjs/queue/types' {
  export interface JobOptions {
    queue?: string
    maxRetries?: number
  }
}

// Vite build hook — dynamic import target in adonisrc.ts snippets
declare module '@adonisjs/vite/build_hook' {
  const hook: unknown
  export default hook
}

// Fallback for any other wildcard project-relative import the snippets may
// introduce (theme variants, #abilities/main, etc.). Keep this permissive so
// the typechecker stays focused on doctrine-critical APIs, not on module
// resolution plumbing.
declare module '#abilities/*' {
  const mod: Record<string, unknown>
  export = mod
}

declare module '#controllers/*' {
  const mod: Record<string, unknown>
  export default mod
}

// ---------------------------------------------------------------------------
// Test runner globals (Japa)
//
// Snippets in references/patterns/advanced.md and references/testing.md
// reference `test(...)` at module scope as a Japa-style helper. We expose a
// permissive global so those excerpts typecheck without pulling in the
// full Japa types.
// ---------------------------------------------------------------------------
// eslint-disable-next-line
type JapaTestContext = { [key: string]: any }
declare function test(name: string, fn: (ctx: JapaTestContext) => unknown | Promise<unknown>): void
declare namespace test {
  function group(name: string, fn: () => void): void
}

// ---------------------------------------------------------------------------
// Global Mail / Drive / Emitter / Hash / Container services used inside
// fake()/restore() test snippets.
// ---------------------------------------------------------------------------
// eslint-disable-next-line
declare const mail: {
  // eslint-disable-next-line
  fake(): { mails: { assertSent(cls: unknown): void } }
  restore(): void
  send(builder: unknown): Promise<unknown>
  sendLater(notification: unknown): Promise<unknown>
}

declare const drive: {
  fake(): unknown
  restore(): void
  use(disk?: string): unknown
}

declare const emitter: {
  fake(): unknown
  restore(): void
  on(event: string, handler: (...args: unknown[]) => unknown): unknown
  listen(event: unknown, listeners: unknown): unknown
  onError(handler: (err: unknown) => void): unknown
}

// ---------------------------------------------------------------------------
// Default JSX intrinsic elements
//
// The snippets use ordinary HTML tags like <a>, <span>, <div>. Without
// a JSX.IntrinsicElements declaration these trigger TS7026. We keep the
// declaration wildcard-permissive so the doctrine checks (routeParams,
// Link/Form) stay the load-bearing part.
// ---------------------------------------------------------------------------
declare namespace JSX {
  // eslint-disable-next-line
  interface IntrinsicElements {
    // eslint-disable-next-line
    [elemName: string]: any
  }
}
