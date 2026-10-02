import React, { useState } from 'react';
import { X, Github, Check, Copy, ExternalLink, Terminal, Sparkles, Rocket } from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GITHUB_ACTIONS_YAML = `name: Deploy to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

env:
  ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION: "true"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js (v22 LTS)
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Install Dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci
          else
            npm install --no-audit --no-fund
          fi

      - name: Build Application (Static Web Bundle)
        run: npm run build

      - name: Upload Pages Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({ isOpen, onClose }) => {
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [copiedCommands, setCopiedCommands] = useState(false);

  if (!isOpen) return null;

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(GITHUB_ACTIONS_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const terminalCommands = `git init
git add .
git commit -m "feat: Website Analyzer & Audit Tool"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(terminalCommands);
    setCopiedCommands(true);
    setTimeout(() => setCopiedCommands(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/70 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-[#141414] bg-white p-6 shadow-[8px_8px_0px_#141414] space-y-5 text-[#141414]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center border border-[#141414] bg-[#141414] text-white">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#141414] flex items-center gap-2 uppercase">
                DEPLOY TO GITHUB PAGES
                <span className="bg-[#E4E3E0] px-1.5 py-0.2 text-[9px] font-bold text-[#141414] border border-[#141414]">
                  READY
                </span>
              </h3>
              <p className="text-[11px] text-[#141414]/70">
                Static hosting and automation guide with GitHub Actions
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#141414] hover:bg-[#141414] hover:text-white p-1 border border-[#141414] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3.5 text-xs text-[#141414]">
          {/* Step 1 */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-1.5 shadow-[2px_2px_0px_#141414]">
            <h4 className="font-black text-[#141414] flex items-center gap-2 uppercase">
              <span className="flex h-5 w-5 items-center justify-center bg-[#141414] text-[10px] font-bold text-white">
                1
              </span>
              HYBRID ARCHITECTURE & GITHUB PAGES
            </h4>
            <p className="text-[11px] text-[#141414]/80 leading-relaxed">
              The app supports pure static builds with relative asset paths (<code className="bg-[#E4E3E0] px-1 border border-[#141414]">base: './'</code>). On GitHub Pages it autonomously activates the <strong>client-side engine</strong> to analyze domains and render comprehensive reports.
            </p>
          </div>

          {/* Step 2 */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-2 shadow-[2px_2px_0px_#141414]">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[#141414] flex items-center gap-2 uppercase">
                <span className="flex h-5 w-5 items-center justify-center bg-[#141414] text-[10px] font-bold text-white">
                  2
                </span>
                ACTIONS WORKFLOW (.github/workflows/deploy.yml)
              </h4>
              <button
                type="button"
                onClick={handleCopyYaml}
                className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#141414] bg-white hover:bg-[#E4E3E0] px-2 py-1 border border-[#141414] transition-colors cursor-pointer"
              >
                {copiedYaml ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                <span>{copiedYaml ? 'COPIED' : 'COPY YAML'}</span>
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto border border-[#141414] bg-[#141414] p-2.5 font-mono text-[11px] text-[#E4E3E0]">
              <pre className="whitespace-pre-wrap">{GITHUB_ACTIONS_YAML}</pre>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-2 shadow-[2px_2px_0px_#141414]">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-[#141414] flex items-center gap-2 uppercase">
                <span className="flex h-5 w-5 items-center justify-center bg-[#141414] text-[10px] font-bold text-white">
                  3
                </span>
                GIT INITIALIZATION COMMANDS
              </h4>
              <button
                type="button"
                onClick={handleCopyCommands}
                className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#141414] bg-white hover:bg-[#E4E3E0] px-2 py-1 border border-[#141414] transition-colors cursor-pointer"
              >
                {copiedCommands ? <Check className="h-3 w-3 text-emerald-700" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCommands ? 'COPIED' : 'COPY COMMANDS'}</span>
              </button>
            </div>
            <div className="border border-[#141414] bg-[#141414] p-2.5 font-mono text-[11px] text-[#E4E3E0]">
              <pre className="whitespace-pre-wrap">{terminalCommands}</pre>
            </div>
          </div>

          {/* Step 4 */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-1.5 shadow-[2px_2px_0px_#141414]">
            <h4 className="font-black text-[#141414] flex items-center gap-2 uppercase">
              <span className="flex h-5 w-5 items-center justify-center bg-[#141414] text-[10px] font-bold text-white">
                4
              </span>
              ENABLE IN GITHUB
            </h4>
            <p className="text-[11px] text-[#141414]/80 leading-relaxed">
              In your repository, navigate to <strong>Settings &gt; Pages &gt; Build and deployment</strong> and choose <strong>Source: GitHub Actions</strong>. Deployment runs automatically on every push to <code className="bg-[#E4E3E0] px-1 border border-[#141414]">main</code>.
            </p>
          </div>

          {/* Note on Node 20/22 & Lockfile */}
          <div className="border-2 border-[#141414] bg-amber-50 p-4 space-y-2 shadow-[2px_2px_0px_#141414]">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase">
              <span className="bg-amber-400 px-1 py-0.5 text-[9px] border border-[#141414] text-[#141414]">
                FIX INCLUDED
              </span>
              <span>RESOLVED ERROR: NODE 22 &amp; RESILIENT LOCKFILE</span>
            </div>
            <p className="text-[11px] text-[#141414]/90 leading-relaxed">
              If your GitHub Actions run encountered <em>&quot;Dependencies lock file is not found&quot;</em> or warning <em>&quot;Node 20 is being deprecated&quot;</em>, the workflow is already upgraded to <strong>Node 22 LTS</strong> with a resilient dependency installer. To sync your repository:
            </p>
            <div className="border border-[#141414] bg-[#141414] p-2 font-mono text-[10px] text-amber-300 select-all">
              git add .github/workflows/deploy.yml package-lock.json &amp;&amp; git commit -m &quot;fix(ci): update to node 22 and resilient lockfile&quot; &amp;&amp; git push
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
