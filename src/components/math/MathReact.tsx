import katex from "katex";

interface Props {
  expr: string;
  display?: boolean;
}

export function MathReact({ expr, display = false }: Props) {
  const html = katex.renderToString(expr, { displayMode: display, throwOnError: false });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
