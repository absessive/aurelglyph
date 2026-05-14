export type TokenLeaf = string;
export type TokenTree = { [key: string]: TokenLeaf | TokenTree };

export type FlatToken = {
  path: string[];
  name: string;
  value: string;
};
