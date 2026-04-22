import React, { useState } from 'react';
import './ApiReferenceAppendix.scss';

type ApiReferenceAppendixProps = {
  title?: string;
  children: React.ReactNode;
};

export default function ApiReferenceAppendix({ title = 'API Reference Appendix', children }: ApiReferenceAppendixProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="api-reference-appendix">
      <button
        className={`api-reference-appendix__trigger ${open ? 'api-reference-appendix__trigger--open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="api-reference-appendix__label">{title}</span>
        <svg
          className={`api-reference-appendix__chevron ${open ? 'api-reference-appendix__chevron--open' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="api-reference-appendix__content">
          {children}
        </div>
      )}
    </div>
  );
}
