/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import axios from "axios";
import { Trophy, BookOpen, CheckCircle, ClipboardList, Info } from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Header } from "@/components/dashboard/Header";
import { useTheme } from "@/hooks/useTheme";

const AchievementsPage = () => {
 
  const [achievements, setAchievements] = useState<any>(null);
 
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const userId = user.id;
  const { theme } = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [achRes, lbRes] = await Promise.all([
          axios.get(`http://localhost:8080/api/learner/achievements/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:8080/api/learner/achievements/${userId}/leaderboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setAchievements(achRes.data);
        setLeaderboard(lbRes.data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load achievements.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, token]);

  if (loading) return <p className="text-center mt-8">Loading...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">{error}</p>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statIcons: any = {
    coursesEnrolled: BookOpen,
    coursesCompleted: CheckCircle,
    quizzesPassed: Trophy,
    exercisesSolved: ClipboardList,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statLabels: any = {
    coursesEnrolled: "Courses Enrolled",
    coursesCompleted: "Courses Completed",
    quizzesPassed: "Quizzes Passed",
    exercisesSolved: "Exercises Solved",
  };

  const topScore = Math.max(...leaderboard.map((entry) => entry.score), 1);

  return (
    <div className="min-h-screen bg-background">
          <Header />
          <Sidebar />

      <main className="flex-1 ml-64 p-6 bg-background min-h-screen space-y-8">

        {/* ─── Stats Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.keys(statIcons).map((key) => {
            const Icon = statIcons[key];
            return (
              <div  key={key} className="flex items-center gap-4 bg-card shadow rounded-lg p-4 hover:shadow-lg transition">
                <div className="bg-gradient-to-tr from-blue-400 to-purple-500 text-white rounded-full p-3">
                  <Icon className="w-6 h-6" />
                </div>
                <div >
                  <p className="text-sm text-gray-500">{statLabels[key]}</p>
                  <p className="text-xl font-bold">{achievements.stats[key]}</p>
                </div>
              </div>
            );
          })}
         <div className="flex items-center gap-4 bg-card shadow rounded-lg p-4 hover:shadow-lg transition">
                <div className="bg-yellow-400 text-white rounded-full p-3">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Badges Earned</p>
                  <p className="text-xl font-bold text-foreground">
                {achievements.stats.earnedBadges}/{achievements.stats.totalBadges}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Badges ─── */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Badges</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {achievements.badges.map((badge: any) => (
              <TooltipProvider key={badge.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex flex-col items-center justify-center p-4 rounded-lg border transition transform hover:scale-105 cursor-pointer ${
                     badge.earned ? "bg-card border-yellow-400 shadow-md" : "bg-muted border-border opacity-50"
                    }`}>
                      <div className={`text-3xl mb-2 ${badge.earned ? "" : "opacity-40"}`}>
                        {badge.icon}
                      </div>
                      <p className="text-sm font-semibold text-center text-foreground">{badge.name}</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="text-sm bg-gray-800 text-white p-2 rounded shadow">
                    {badge.description || "Complete this badge to earn it!"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* ─── Leaderboard ─── */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gradient-to-r from-purple-400 to-blue-500 text-white">
                <tr>
                  <th className="px-4 py-2">Rank</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Courses Completed</th>
                  <th className="px-4 py-2">Badges</th>
                  <th className="px-4 py-2">
                  <div className="flex items-center gap-1.5">
                    Score
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p>Score = cours complétés × 100 + badges × 10</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div> </th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry: any) => {
                  let rankIcon;
                  if (entry.rank === 1) rankIcon = "🥇";
                  else if (entry.rank === 2) rankIcon = "🥈";
                  else if (entry.rank === 3) rankIcon = "🥉";

                  const progressWidth = (entry.score / topScore) * 100 + "%";

                  // ✅ FIXED: Lombok serializes "boolean isXxx" as "xxx" in JSON
                  // so backend sends "currentUser" not "isCurrentUser"
                  const isMe = entry.currentUser === true;

                  return (
                    <tr className={`border-t border-border transition hover:bg-muted ${isMe ? "bg-yellow-100/20 font-bold" : "bg-card"}`}
                    >
                      <td className="px-4 py-2">{rankIcon || entry.rank}</td>
                      <td className="px-4 py-2">
                        {entry.username}
                        {isMe && (
                          <span className="ml-2 text-xs bg-yellow-400 text-white px-2 py-0.5 rounded-full font-semibold">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">{entry.coursesCompleted}</td>
                      <td className="px-4 py-2">{entry.badgesEarned}</td>
                      <td className="px-4 py-2 w-1/4">
                        <div className="bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-400 to-blue-500"
                            style={{ width: progressWidth }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{entry.score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;