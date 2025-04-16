
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import { Calendar, Clock, Award, BookOpen, GitFork, Brain } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { SectionHeading } from "@/components/ui/section-heading";
import { getUserProgress, getUserStats } from "@/services/mockApi";

const DashboardPage = () => {
  const [progressData, setProgressData] = useState([]);
  const [userStats, setUserStats] = useState({
    lessonsCompleted: 0,
    currentStreak: 0,
    totalTime: "",
    accuracy: 0,
    fluency: 0,
    vocabulary: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progress, stats] = await Promise.all([
          getUserProgress(),
          getUserStats(),
        ]);
        
        setProgressData(progress);
        setUserStats(stats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const languageSkillsData = [
    { name: "Grammar", value: 78 },
    { name: "Vocabulary", value: 65 },
    { name: "Listening", value: 82 },
    { name: "Speaking", value: 70 },
    { name: "Reading", value: 85 },
    { name: "Writing", value: 75 },
  ];

  const colors = ["#7E69AB", "#6E59A5", "#0EA5E9", "#F97316", "#D946EF", "#84cc16"];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-t-transparent border-primary rounded-full animate-spin"></div>
            <p className="text-lg font-medium">Loading your learning stats...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <SectionHeading 
            title="Learning Dashboard" 
            subtitle="Track your progress and see insights about your language learning journey"
          />
          
          <div className="max-w-7xl mx-auto">
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
            >
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <BookOpen className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.lessonsCompleted}</div>
                <div className="text-xs text-muted-foreground">Lessons Completed</div>
              </div>
              
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <GitFork className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.currentStreak}</div>
                <div className="text-xs text-muted-foreground">Day Streak</div>
              </div>
              
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <Clock className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.totalTime}</div>
                <div className="text-xs text-muted-foreground">Total Learning Time</div>
              </div>
              
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <Award className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <Calendar className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.fluency}%</div>
                <div className="text-xs text-muted-foreground">Fluency</div>
              </div>
              
              <div className="varna-card p-4 flex flex-col items-center">
                <div className="p-2 rounded-full bg-varna-light-purple mb-2">
                  <Brain className="w-5 h-5 text-varna-purple" />
                </div>
                <div className="text-2xl font-bold">{userStats.vocabulary}</div>
                <div className="text-xs text-muted-foreground">Words Learned</div>
              </div>
            </motion.div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Weekly Progress</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={progressData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7E69AB" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#7E69AB" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="day" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#7E69AB"
                        fillOpacity={1}
                        fill="url(#colorScore)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="varna-card p-6"
              >
                <h3 className="text-xl font-bold mb-4">Language Skills</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={languageSkillsData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Skill Level">
                        {languageSkillsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
            
            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 varna-card p-6"
            >
              <h3 className="text-xl font-bold mb-4">Personalized Recommendations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors duration-200">
                  <h4 className="font-medium mb-2">Practice Present Perfect</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your grammar stats show this is an area where you could improve.
                  </p>
                  <button className="varna-button-outline text-sm py-1 px-3">Start Lesson</button>
                </div>
                
                <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors duration-200">
                  <h4 className="font-medium mb-2">Restaurant Conversation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Continue practicing your roleplay scenarios to improve fluency.
                  </p>
                  <button className="varna-button-outline text-sm py-1 px-3">Continue</button>
                </div>
                
                <div className="p-4 border border-border rounded-lg hover:border-primary transition-colors duration-200">
                  <h4 className="font-medium mb-2">Pronunciation: R Sounds</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Focus on this sound to improve your overall pronunciation score.
                  </p>
                  <button className="varna-button-outline text-sm py-1 px-3">Start Practice</button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DashboardPage;
