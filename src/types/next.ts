/**
 * Next.js 16 requires params and searchParams to be awaited.
 */
export type PageProps = {
  params: Promise<{ [key: string]: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
