import { User, Trophy, CheckCircle, Clock, Code, TrendingUp, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockSubmissions, mockContests } from '@/utils/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PageTransition from '@/components/PageTransition';

const submissionsByDay = [
  { day: 'Mon', count: 5 },
  { day: 'Tue', count: 8 },
  { day: 'Wed', count: 3 },
  { day: 'Thu', count: 12 },
  { day: 'Fri', count: 7 },
  { day: 'Sat', count: 15 },
  { day: 'Sun', count: 9 },
];

const verdictData = [
  { name: 'Accepted', value: 42, color: 'hsl(142, 71%, 45%)' },
  { name: 'Wrong Answer', value: 18, color: 'hsl(0, 84%, 60%)' },
  { name: 'TLE', value: 8, color: 'hsl(38, 92%, 50%)' },
  { name: 'Runtime Error', value: 5, color: 'hsl(217, 91%, 60%)' },
];

const ratingHistory = [
  { contest: 'Week 8', rating: 1200 },
  { contest: 'Week 9', rating: 1280 },
  { contest: 'Week 10', rating: 1350 },
  { contest: 'Week 11', rating: 1310 },
  { contest: 'Week 12', rating: 1420 },
];

const contestHistory = [
  { id: '1', title: 'DevFlow Weekly #12', date: '2026-03-05', rank: 12, solved: 3, total: 4 },
  { id: '2', title: 'Data Structures Sprint', date: '2026-03-01', rank: 5, solved: 4, total: 4 },
  { id: '3', title: 'Algorithm Masters Cup', date: '2026-02-25', rank: 28, solved: 2, total: 5 },
  { id: '4', title: 'Beginner Friendly #3', date: '2026-02-20', rank: 1, solved: 3, total: 3 },
  { id: '5', title: 'Weekly Challenge #11', date: '2026-02-15', rank: 8, solved: 3, total: 4 },
];

const ProfilePage = () => {
  const totalSubmissions = 73;
  const accepted = 42;
  const accuracy = Math.round((accepted / totalSubmissions) * 100);

  return (
    <PageTransition>
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0">
          <User className="h-8 w-8 md:h-10 md:w-10 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">dev_user</h1>
          <p className="text-sm text-muted-foreground">dev_user@devflow.com</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <TrendingUp className="h-3 w-3 mr-1" /> Rating: 1420
            </Badge>
            <Badge variant="outline" className="bg-accent text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" /> Joined Feb 2026
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: 'Problems Solved', value: accepted, icon: CheckCircle, accent: 'text-success' },
          { label: 'Submissions', value: totalSubmissions, icon: Code, accent: 'text-info' },
          { label: 'Accuracy', value: `${accuracy}%`, icon: TrendingUp, accent: 'text-primary' },
          { label: 'Contests', value: contestHistory.length, icon: Trophy, accent: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.accent}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        {/* Submissions chart */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Submissions This Week</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={submissionsByDay}>
                <XAxis dataKey="day" tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(217, 33%, 17%)',
                    border: '1px solid hsl(217, 33%, 22%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 40%, 98%)',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verdict breakdown */}
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Verdict Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="h-48 w-48 mx-auto lg:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verdictData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {verdictData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(217, 33%, 17%)',
                      border: '1px solid hsl(217, 33%, 22%)',
                      borderRadius: '8px',
                      color: 'hsl(210, 40%, 98%)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 hidden sm:block">
              {verdictData.map((v) => (
                <div key={v.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: v.color }} />
                  <span className="text-muted-foreground">{v.name}</span>
                  <span className="text-foreground font-medium ml-auto">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile legend */}
          <div className="flex flex-wrap gap-3 mt-3 sm:hidden">
            {verdictData.map((v) => (
              <div key={v.name} className="flex items-center gap-1.5 text-xs">
                <div className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                <span className="text-muted-foreground">{v.name}: {v.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rating history */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-5 mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4">Rating History</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingHistory}>
              <XAxis dataKey="contest" tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[1100, 1500]} tick={{ fill: 'hsl(215, 20%, 65%)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(217, 33%, 17%)',
                  border: '1px solid hsl(217, 33%, 22%)',
                  borderRadius: '8px',
                  color: 'hsl(210, 40%, 98%)',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="rating" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contest participation history */}
      <div className="rounded-lg border border-border bg-card p-4 md:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Contest History</h3>

        {/* Desktop table */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Contest</th>
                <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Date</th>
                <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Rank</th>
                <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Solved</th>
              </tr>
            </thead>
            <tbody>
              {contestHistory.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                  <td className="py-2.5 px-3 text-foreground font-medium">{c.title}</td>
                  <td className="py-2.5 px-3 text-center text-muted-foreground">{new Date(c.date).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono font-semibold ${c.rank <= 3 ? 'text-primary' : 'text-foreground'}`}>#{c.rank}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-muted-foreground">{c.solved}/{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {contestHistory.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-accent/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm truncate mr-2">{c.title}</span>
                <span className={`font-mono text-sm font-semibold shrink-0 ${c.rank <= 3 ? 'text-primary' : 'text-foreground'}`}>#{c.rank}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{new Date(c.date).toLocaleDateString()}</span>
                <span>{c.solved}/{c.total} solved</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default ProfilePage;
