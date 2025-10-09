// React imports for hooks and lazy loading
import { useContext, useMemo, lazy, Suspense, useEffect } from "react";

// Styled components for the Home page layout and UI elements
import {
  AddButton,
  GreetingHeader,
  Offline,
  ProgressPercentageContainer,
  StyledProgress,
  TaskCompletionText,
  TaskCountClose,
  TaskCountHeader,
  TaskCountTextContainer,
  TasksCount,
  TasksCountContainer,
} from "../styles";

// External libraries for UI components and icons
import { Emoji } from "emoji-picker-react";
import { Box, Button, CircularProgress, Tooltip, Typography } from "@mui/material";
import { AddRounded, CloseRounded, TodayRounded, UndoRounded, WifiOff } from "@mui/icons-material";

// Custom hooks and contexts
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { UserContext } from "../contexts/UserContext";
import { useResponsiveDisplay } from "../hooks/useResponsiveDisplay";
import { useNavigate } from "react-router-dom";

// Components and utilities
import { AnimatedGreeting } from "../components/AnimatedGreeting";
import { showToast } from "../utils";

// Lazy load the TasksList component for better performance
const TasksList = lazy(() =>
  import("../components/tasks/TasksList").then((module) => ({ default: module.TasksList })),
);

/**
 * Home Component - Main dashboard page of the Todo App
 * 
 * This component serves as the central hub where users can:
 * - View their task progress and statistics
 * - See personalized greetings based on time of day
 * - Access their task list
 * - Add new tasks (on desktop)
 * - View offline status
 * - Manage progress bar visibility
 */
const Home = () => {
  // Extract user data and state management from context
  const { user, setUser } = useContext(UserContext);
  const { tasks, emojisStyle, settings, name } = user;

  // Custom hooks for app functionality
  const isOnline = useOnlineStatus(); // Track internet connectivity
  const n = useNavigate(); // Navigation hook for routing
  const isMobile = useResponsiveDisplay(); // Detect mobile device

  // Set page title when component mounts
  useEffect(() => {
    document.title = "Todo App";
  }, []);

  /**
   * Calculate task statistics and progress metrics
   * Memoized to prevent unnecessary recalculations when tasks haven't changed
   */
  const taskStats = useMemo(() => {
    // Count completed tasks
    const completedCount = tasks.filter((task) => task.done).length;
    // Calculate completion percentage (0-100)
    const completedPercentage = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    // Get today's date at midnight for accurate comparison
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Filter tasks that are due today and not yet completed
    const dueTodayTasks = tasks.filter((task) => {
      if (task.deadline) {
        const taskDeadline = new Date(task.deadline).setHours(0, 0, 0, 0);
        return taskDeadline === today && !task.done;
      }
      return false;
    });

    // Extract task names for display
    const taskNamesDueToday = dueTodayTasks.map((task) => task.name);

    return {
      completedTasksCount: completedCount,
      completedTaskPercentage: completedPercentage,
      tasksWithDeadlineTodayCount: dueTodayTasks.length,
      tasksDueTodayNames: taskNamesDueToday,
    };
  }, [tasks]);

  /**
   * Generate time-based greeting message
   * Memoized to avoid recalculating on every render
   */
  const timeGreeting = useMemo(() => {
    const currentHour = new Date().getHours();
    // Determine greeting based on current time
    if (currentHour < 12 && currentHour >= 5) {
      return "Good morning";
    } else if (currentHour < 18 && currentHour > 12) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  }, []);

  /**
   * Generate motivational text based on task completion percentage
   * Provides encouraging messages to keep users motivated
   */
  const taskCompletionText = useMemo(() => {
    const percentage = taskStats.completedTaskPercentage;
    // Return different messages based on completion percentage
    switch (true) {
      case percentage === 0:
        return "No tasks completed yet. Keep going!";
      case percentage === 100:
        return "Congratulations! All tasks completed!";
      case percentage >= 75:
        return "Almost there!";
      case percentage >= 50:
        return "You're halfway there! Keep it up!";
      case percentage >= 25:
        return "You're making good progress.";
      default:
        return "You're just getting started.";
    }
  }, [taskStats.completedTaskPercentage]);

  /**
   * Update the progress bar visibility setting
   * @param value - Boolean indicating whether to show the progress bar
   */
  const updateShowProgressBar = (value: boolean) => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        showProgressBar: value,
      },
    }));
  };

  return (
    <>
      {/* Personalized greeting header with wave emoji and user's name */}
      <GreetingHeader>
        <Emoji unified="1f44b" emojiStyle={emojisStyle} /> &nbsp; {timeGreeting}
        {name && (
          <span translate="no">
            , <span>{name}</span>
          </span>
        )}
      </GreetingHeader>

      {/* Animated greeting component for enhanced user experience */}
      <AnimatedGreeting />

      {/* Offline status indicator - shows when user is not connected to internet */}
      {!isOnline && (
        <Offline>
          <WifiOff /> You're offline but you can use the app!
        </Offline>
      )}
      {/* Progress bar section - only shown when there are tasks and user has enabled it */}
      {tasks.length > 0 && settings.showProgressBar && (
        <TasksCountContainer>
          <TasksCount glow={settings.enableGlow}>
            {/* Close button to hide progress bar with undo option */}
            <TaskCountClose
              size="small"
              onClick={() => {
                updateShowProgressBar(false);
                // Show toast with undo option for better UX
                showToast(
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    Progress bar hidden. You can enable it in settings.
                    <Button
                      variant="contained"
                      sx={{ p: "12px 32px" }}
                      onClick={() => updateShowProgressBar(true)}
                      startIcon={<UndoRounded />}
                    >
                      Undo
                    </Button>
                  </span>,
                );
              }}
            >
              <CloseRounded />
            </TaskCountClose>
            {/* Circular progress indicator with percentage display */}
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <StyledProgress
                variant="determinate"
                value={taskStats.completedTaskPercentage}
                size={64}
                thickness={5}
                aria-label="Progress"
                glow={settings.enableGlow}
              />

              {/* Percentage text overlay on the progress circle */}
              <ProgressPercentageContainer
                glow={settings.enableGlow && taskStats.completedTaskPercentage > 0}
              >
                <Typography
                  variant="caption"
                  component="div"
                  color="white"
                  sx={{ fontSize: "16px", fontWeight: 600 }}
                >{`${Math.round(taskStats.completedTaskPercentage)}%`}</Typography>
              </ProgressPercentageContainer>
            </Box>
            {/* Task statistics and motivational text */}
            <TaskCountTextContainer>
              {/* Dynamic task count header */}
              <TaskCountHeader>
                {taskStats.completedTasksCount === 0
                  ? `You have ${tasks.length} task${tasks.length > 1 ? "s" : ""} to complete.`
                  : `You've completed ${taskStats.completedTasksCount} out of ${tasks.length} tasks.`}
              </TaskCountHeader>
              {/* Motivational completion text */}
              <TaskCompletionText>{taskCompletionText}</TaskCompletionText>
              {/* Show tasks due today if any exist */}
              {taskStats.tasksWithDeadlineTodayCount > 0 && (
                <span
                  style={{
                    opacity: 0.8,
                    display: "inline-block",
                  }}
                >
                  <TodayRounded sx={{ fontSize: "20px", verticalAlign: "middle" }} />
                  &nbsp;Tasks due today:&nbsp;
                  <span translate="no">
                    {new Intl.ListFormat("en", { style: "long" }).format(
                      taskStats.tasksDueTodayNames,
                    )}
                  </span>
                </span>
              )}
            </TaskCountTextContainer>
          </TasksCount>
        </TasksCountContainer>
      )}
      
      {/* Lazy-loaded task list with loading fallback */}
      <Suspense
        fallback={
          <Box display="flex" justifyContent="center" alignItems="center">
            <CircularProgress />
          </Box>
        }
      >
        <TasksList />
      </Suspense>
      
      {/* Floating add button - only shown on desktop devices */}
      {!isMobile && (
        <Tooltip title={tasks.length > 0 ? "Add New Task" : "Add Task"} placement="left">
          <AddButton
            animate={tasks.length === 0} // Animate when no tasks exist to draw attention
            glow={settings.enableGlow}
            onClick={() => n("add")} // Navigate to add task page
            aria-label="Add Task"
          >
            <AddRounded style={{ fontSize: "44px" }} />
          </AddButton>
        </Tooltip>
      )}
    </>
  );
};

export default Home;
