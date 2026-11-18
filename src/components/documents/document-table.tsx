"use client";
import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import type { DocumentDto } from "@/lib/contracts";
import { FileIcon, Empty } from "@/components/ui/shared";
import { dateLabel, fileSize, initials } from "@/lib/utils";
export function DocumentTable({ documents }: { documents: DocumentDto[] }) {
  if (!documents.length)
    return (
      <Empty
        title="No documents found"
        description="Try another search or clear your filters."
      />
    );
  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th>Document name</th>
            <th>Department</th>
            <th>Category</th>
            <th>Uploaded</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td>
                <Link className="document-name" href={`/documents/${doc.id}`}>
                  <FileIcon name={doc.file.name} />
                  <span>
                    <strong>{doc.title}</strong>
                    <small>
                      {doc.file.name.split(".").pop()?.toUpperCase()}{" "}
                      <span>·</span> {fileSize(doc.file.sizeBytes)}
                    </small>
                  </span>
                </Link>
              </td>
              <td>
                <span
                  className={`department-badge dept-${doc.department.id.split("-").pop()}`}
                >
                  {doc.department.name}
                </span>
              </td>
              <td>
                <span className="category-text">{doc.category.name}</span>
              </td>
              <td>
                <div className="date-cell">
                  {dateLabel(doc.createdAt)}
                  <small>
                    <span className="tiny-avatar">
                      {initials(doc.owner.name)}
                    </span>
                    {doc.owner.name}
                  </small>
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <a
                    href={`/api/documents/${doc.id}/download`}
                    className="icon-button"
                    aria-label={`Download ${doc.title}`}
                  >
                    <Download size={16} />
                  </a>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="icon-button"
                    aria-label={`View ${doc.title}`}
                  >
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
