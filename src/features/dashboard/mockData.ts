export const MOCK_CLASS_DATA = {
    className: "AP Lang Period 3",
    activeAssignment: "JFK Inaugural Address",
    studentCount: 28,
    completionRate: 82,
    averageReadingTime: "14m 30s",
    verbUsage: [
        { verb: "Juxtaposes", count: 45, category: "Comparison" },
        { verb: "Highlights", count: 32, category: "Emphasis" },
        { verb: "Shifts", count: 28, category: "Structure" },
        { verb: "Laments", count: 12, category: "Tone" },
        { verb: "Refutes", count: 8, category: "Argument" },
        { verb: "Shows", count: 5, category: "Banned" }, // "Shows" is a generic verb we want to discourage
    ],
    confusionPoints: [
        { paragraph: 1, confusionScore: 10 }, // Low confusion
        { paragraph: 2, confusionScore: 45 }, // Moderate - "mortal hands" concept
        { paragraph: 3, confusionScore: 15 },
        { paragraph: 4, confusionScore: 85 }, // High - "pay any price, bear any burden" (maybe context?)
        { paragraph: 5, confusionScore: 5 },
        { paragraph: 6, confusionScore: 60 }, // "split asunder" vocabulary
    ],
    recentActivity: [
        { student: "Alex M.", action: "Completed SPACECAT", time: "2m ago" },
        { student: "Sarah J.", action: "Annotated 'Juxtaposes'", time: "5m ago" },
        { student: "David K.", action: "Built Thesis", time: "12m ago" },
        { student: "Emily R.", action: "Started Reading", time: "15m ago" },
    ]
};
