import { useState, useMemo } from 'react';
import { mockSubmissions } from '@/utils/mockData';
import SubmissionTable from '@/components/SubmissionTable';
import { History, Filter } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const SubmissionsPage = () => {
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const verdicts = ['all', ...new Set(mockSubmissions.map(s => s.verdict))];
  const languages = ['all', ...new Set(mockSubmissions.map(s => s.language))];

  const filtered = useMemo(() => {
    return mockSubmissions.filter(s => {
      if (verdictFilter !== 'all' && s.verdict !== verdictFilter) return false;
      if (languageFilter !== 'all' && s.language !== languageFilter) return false;
      return true;
    });
  }, [verdictFilter, languageFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleVerdictChange = (v: string) => { setVerdictFilter(v); setCurrentPage(1); };
  const handleLanguageChange = (v: string) => { setLanguageFilter(v); setCurrentPage(1); };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, safeCurrentPage - 1); i <= Math.min(totalPages - 1, safeCurrentPage + 1); i++) {
        pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Submission History</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                {filtered.length} submission{filtered.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={verdictFilter} onValueChange={handleVerdictChange}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
                <SelectValue placeholder="Verdict" />
              </SelectTrigger>
              <SelectContent>
                {verdicts.map(v => (
                  <SelectItem key={v} value={v}>{v === 'all' ? 'All Verdicts' : v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={languageFilter} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map(l => (
                  <SelectItem key={l} value={l}>{l === 'all' ? 'All Languages' : l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {paginated.length > 0 ? (
          <>
            <SubmissionTable submissions={paginated} />
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={safeCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((page, i) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`e-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={page === safeCurrentPage}
                            onClick={() => setCurrentPage(page)}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={safeCurrentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">No submissions match your filters.</div>
        )}
      </div>
    </PageTransition>
  );
};

export default SubmissionsPage;
