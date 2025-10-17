import React from 'react';
import { FileText, Download, Trash2, Calendar, Tag, User } from 'lucide-react';
import Button from './Button';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_size: number;
  mime_type: string;
  description?: string;
  upload_date: string;
  uploaded_by_user?: {
    full_name: string;
  };
  metadata?: Array<{
    category: string;
    tags: string[];
    visit_date?: string;
    notes?: string;
  }>;
}

interface DocumentViewerProps {
  documents: Document[];
  onDelete: (id: string) => void;
  onDownload: (document: Document) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documents,
  onDelete,
  onDownload,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️';
    }
    if (mimeType.includes('pdf')) {
      return '📄';
    }
    if (mimeType.includes('word') || mimeType.includes('doc')) {
      return '📝';
    }
    return '📎';
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No documents uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => {
        const metadata = doc.metadata?.[0];
        return (
          <div
            key={doc.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl">{getDocumentIcon(doc.mime_type)}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {doc.document_name}
                  </h3>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-500">
                      {doc.document_type.replace('_', ' ')} · {formatFileSize(doc.file_size)}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-gray-600">{doc.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(doc.upload_date)}
                      </span>
                      {doc.uploaded_by_user && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {doc.uploaded_by_user.full_name}
                        </span>
                      )}
                    </div>
                    {metadata && (
                      <div className="mt-2 space-y-1">
                        {metadata.category && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {metadata.category}
                          </span>
                        )}
                        {metadata.tags && metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {metadata.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {metadata.visit_date && (
                          <p className="text-xs text-gray-500">
                            Visit: {formatDate(metadata.visit_date)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDownload(doc)}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(doc.id)}
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentViewer;
