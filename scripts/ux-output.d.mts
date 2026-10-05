export type UxOutputOptions = {
  home?: string;
  temporaryRoot?: string;
  workspace?: string;
};

export function resolveUxOutputRoot(value?: string, options?: UxOutputOptions): string;
