import { revalidatePath, revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const path = searchParams.get('path');
    const secret = searchParams.get('secret');

    // Optional secret check
    if (process.env.REVALIDATION_SECRET && secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid revalidation secret' }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag, now: Date.now() });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    }

    // Default: revalidate home and stores
    revalidatePath('/');
    return NextResponse.json({ revalidated: true, scope: 'root', now: Date.now() });
  } catch (err: any) {
    return NextResponse.json({ message: 'Error revalidating', error: err?.message }, { status: 500 });
  }
}
