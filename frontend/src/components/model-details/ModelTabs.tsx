import React from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Button } from '../ui/button';
import { History } from 'lucide-react';
import { Badge } from '../ui/badge';
import { solarizedLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
interface ModelTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  readme: string | null;
  config: string | null;
  versions: any[];
  model: any;
  selectedVersionId: string | null;
  setSelectedVersionId: (id: string | null) => void;
  formatBytes: (bytes: number | null | undefined) => string;
  formatNumber: (num: number) => string;
  formatDate: (dateString: string) => string;
  handleVersionView: (modelId: string, versionId: string) => void;
  handleVersionDownload: (modelId: string, versionId: string) => void;
}

export const ModelTabs: React.FC<ModelTabsProps> = ({
  activeTab,
  setActiveTab,
  readme,
  config,
  versions,
  model,
  selectedVersionId,
  setSelectedVersionId,
  formatBytes,
  formatNumber,
  formatDate,
  handleVersionView,
  handleVersionDownload
}) => {
  return (
    <div className="mt-8">
      <div className="border-b">
        <ul className="flex -mb-px">
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === "readme"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("readme")}
            >
              README
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === "config"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("config")}
            >
              Configuration
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block py-2 px-4 border-b-2 ${
                activeTab === "versions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent"
              }`}
              onClick={() => setActiveTab("versions")}
            >
              Versions
            </button>
          </li>
        </ul>
      </div>

      <div className="py-4">
        {activeTab === "readme" && (
          <>
            {readme ? (
              <div>
                {/* Add a version indicator if not showing latest version */}
                {model.latestVersion &&
                  model.latestVersion.id !== selectedVersionId &&
                  selectedVersionId && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
                      Viewing README for Version{" "}
                      {versions.find((v) => v.id === selectedVersionId)
                        ?.versionNumber || "?"}
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2"
                        onClick={() => setSelectedVersionId(null)}
                      >
                        View Latest
                      </Button>
                    </div>
                  )}

                <div className="markdown-body prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-2xl font-bold mt-6 mb-4"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-bold mt-5 mb-3"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-lg font-bold mt-4 mb-2"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="mb-4" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-blue-600 hover:underline"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc pl-5 mb-4" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal pl-5 mb-4" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="mb-1" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-gray-200 pl-4 italic"
                          {...props}
                        />
                      ),
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return match ? (
                          <SyntaxHighlighter
                            style={solarizedLight}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md my-4"
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code
                            className="bg-gray-100 px-1 py-0.5 rounded font-mono text-sm"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {readme}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                <p className="text-gray-500">
                  No README file available for this model.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "config" && (
          <>
            {config ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="whitespace-pre-wrap overflow-x-auto text-sm">
                  {config}
                </pre>
              </div>
            ) : (
              <div className="bg-gray-50 border rounded-md p-6 text-center">
                <p className="text-gray-500">
                  No configuration file available for this model.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "versions" && (
          <div className="border rounded-md divide-y">
            {versions.length > 0 ? (
              versions.map((version, index) => (
                <div
                  key={version.id}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                        <History className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-sm font-medium">
                            Version {version.versionNumber}
                          </h3>
                          {index === 0 && (
                            <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(version.createdAt)}
                        </p>
                        {version.commitMessage && (
                          <p className="text-sm mt-2">
                            {version.commitMessage}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 text-xs">
                          <Badge variant="outline" className="bg-gray-50">
                            {formatBytes(version.sizeBytes)}
                          </Badge>
                          {version.parameters && (
                            <Badge variant="outline" className="bg-gray-50">
                              {formatNumber(version.parameters)} parameters
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVersionView(model.id, version.id)}
                      >
                        View Files
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleVersionDownload(model.id, version.id)
                        }
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500">
                  No versions available for this model.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};