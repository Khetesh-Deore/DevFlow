import ContestCard from '@/components/ContestCard';
import { mockContests } from '@/utils/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageTransition from '@/components/PageTransition';
import { StaggerContainer, StaggerItem } from '@/components/StaggerContainer';

const DashboardPage = () => {
  const upcoming = mockContests.filter(c => c.status === 'upcoming');
  const active = mockContests.filter(c => c.status === 'active');
  const ended = mockContests.filter(c => c.status === 'ended');

  const ContestGrid = ({ contests, emptyMsg }: { contests: typeof mockContests; emptyMsg?: string }) => (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {contests.length ? contests.map(c => (
        <StaggerItem key={c.id}>
          <ContestCard contest={c} />
        </StaggerItem>
      )) : (
        <p className="text-muted-foreground col-span-full text-center py-12">{emptyMsg || 'No contests'}</p>
      )}
    </StaggerContainer>
  );

  return (
    <PageTransition>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Browse and join coding contests</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-accent border border-border mb-4 md:mb-6 w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
            <TabsTrigger value="active" className="flex-1 sm:flex-none">Active</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">Upcoming</TabsTrigger>
            <TabsTrigger value="ended" className="flex-1 sm:flex-none">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="all"><ContestGrid contests={mockContests} /></TabsContent>
          <TabsContent value="active"><ContestGrid contests={active} emptyMsg="No active contests" /></TabsContent>
          <TabsContent value="upcoming"><ContestGrid contests={upcoming} /></TabsContent>
          <TabsContent value="ended"><ContestGrid contests={ended} /></TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
