import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface DocFile {
  slug: string;
  title: string;
  content: string;
  frontMatter: Record<string, any>;
  filePath: string;
  lastModified: Date;
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  description?: string;
  props?: ComponentProp[];
  examples?: string[];
  category: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
}

// Get all markdown files from docs directory
export async function getDocumentationFiles(): Promise<DocFile[]> {
  const docsDirectory = path.join(process.cwd(), 'docs');
  
  if (!fs.existsSync(docsDirectory)) {
    return [];
  }

  const files = fs.readdirSync(docsDirectory);
  const docFiles: DocFile[] = [];

  for (const file of files) {
    if (file.endsWith('.md') || file.endsWith('.mdx')) {
      const filePath = path.join(docsDirectory, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data, content: markdownContent } = matter(content);
      const stats = fs.statSync(filePath);

      docFiles.push({
        slug: file.replace(/\.(md|mdx)$/, ''),
        title: data.title || file.replace(/\.(md|mdx)$/, '').replace(/_/g, ' '),
        content: markdownContent,
        frontMatter: data,
        filePath: `/docs/${file}`,
        lastModified: stats.mtime,
      });
    }
  }

  return docFiles.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

// Get a single documentation file by slug
export async function getDocumentationFile(slug: string): Promise<DocFile | null> {
  const docsDirectory = path.join(process.cwd(), 'docs');
  const filePath = path.join(docsDirectory, `${slug}.md`);
  const altFilePath = path.join(docsDirectory, `${slug}.mdx`);
  
  let targetPath = '';
  if (fs.existsSync(filePath)) {
    targetPath = filePath;
  } else if (fs.existsSync(altFilePath)) {
    targetPath = altFilePath;
  } else {
    return null;
  }

  const content = fs.readFileSync(targetPath, 'utf8');
  const { data, content: markdownContent } = matter(content);
  const stats = fs.statSync(targetPath);

  return {
    slug,
    title: data.title || slug.replace(/_/g, ' '),
    content: markdownContent,
    frontMatter: data,
    filePath: `/docs/${path.basename(targetPath)}`,
    lastModified: stats.mtime,
  };
}

// Search documentation files
export async function searchDocumentation(query: string): Promise<DocFile[]> {
  const files = await getDocumentationFiles();
  const searchTerm = query.toLowerCase();

  return files.filter(file => 
    file.title.toLowerCase().includes(searchTerm) ||
    file.content.toLowerCase().includes(searchTerm) ||
    Object.values(file.frontMatter).some(value => 
      String(value).toLowerCase().includes(searchTerm)
    )
  );
}

// Get all component files from components directory
export async function getComponentFiles(): Promise<ComponentInfo[]> {
  const componentsDir = path.join(process.cwd(), 'components');
  const components: ComponentInfo[] = [];

  function scanDirectory(dir: string, category: string = '') {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(filePath, file);
      } else if (file.endsWith('.tsx') && !file.endsWith('.test.tsx') && !file.endsWith('.stories.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const componentName = path.basename(file, '.tsx');
        
        // Basic component detection (can be enhanced with AST parsing)
        if (content.includes('export default') || content.includes('export function') || content.includes('export const')) {
          components.push({
            name: componentName,
            filePath: filePath.replace(process.cwd(), ''),
            category: category || 'General',
            description: extractComponentDescription(content),
            props: extractComponentProps(content),
          });
        }
      }
    }
  }

  if (fs.existsSync(componentsDir)) {
    scanDirectory(componentsDir);
  }

  return components;
}

// Extract component description from JSDoc comments
function extractComponentDescription(content: string): string | undefined {
  const jsdocMatch = content.match(/\/\*\*\s*\n([^*]|\*(?!\/))*\*\//);
  if (jsdocMatch) {
    const comment = jsdocMatch[0];
    const lines = comment.split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .filter(line => line && !line.startsWith('@'));
    return lines.join(' ').trim();
  }
  return undefined;
}

// Basic prop extraction (can be enhanced with TypeScript AST)
function extractComponentProps(content: string): ComponentProp[] {
  const props: ComponentProp[] = [];
  
  // Match interface Props or type Props
  const propsMatch = content.match(/(?:interface|type)\s+(?:\w+)?Props\s*(?:=\s*)?{([^}]+)}/);
  
  if (propsMatch) {
    const propsContent = propsMatch[1];
    const propLines = propsContent.split('\n').filter(line => line.includes(':'));
    
    for (const line of propLines) {
      const match = line.match(/^\s*(\w+)(\?)?\s*:\s*([^;]+)/);
      if (match) {
        props.push({
          name: match[1],
          type: match[3].trim(),
          required: !match[2],
        });
      }
    }
  }
  
  return props;
}