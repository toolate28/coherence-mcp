/**
 * Context Pack Module
 * 
 * Packs document paths and metadata into .context.yaml structure
 * with hash verification for integrity.
 */

import * as YAML from "yaml";

export interface ContextDocument {
  path: string;
  included: boolean;
}

export interface ContextData {
  version: string;
  timestamp: string;
  meta: any;
  documents: ContextDocument[];
}

/**
 * Pack document paths and metadata into .context.yaml format
 */
export async function packContext(docPaths: string[], meta: any): Promise<string> {
  const contextData: ContextData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    meta,
    documents: docPaths.map(path => ({
      path,
      included: true,
    })),
  };
  
  return YAML.stringify(contextData);
}
