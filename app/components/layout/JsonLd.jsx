export function JsonLd({ data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      /* Structured data we generate ourselves. */
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
