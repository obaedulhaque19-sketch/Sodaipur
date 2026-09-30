declare module 'next' {
  export interface Metadata {
    title?: string;
    description?: string;
    metadataBase?: URL;
    alternates?: {
      canonical?: string;
    };
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      siteName?: string;
      images?: Array<{
        url: string;
        width?: number;
        height?: number;
        alt?: string;
      }>;
      locale?: string;
      type?: string;
    };
    twitter?: {
      card?: string;
      title?: string;
      description?: string;
      images?: Array<{
        url: string;
      }>;
    };
  }
}

declare module 'next/navigation' {
  export function redirect(url: string, type?: 'push' | 'replace'): never;
  export function notFound(): never;
  export function usePathname(): string;
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
  };
  export function useSearchParams(): URLSearchParams;
}

declare module 'next/cache' {
  export function revalidatePath(originalPath: string, type?: 'layout' | 'page'): void;
  export function revalidateTag(tag: string): void;
}

declare module 'next/server' {
  export class NextRequest extends Request {
    readonly nextUrl: URL;
  }
  export class NextResponse extends Response {
    static json<T = any>(body: T, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static next(): NextResponse;
  }
}
