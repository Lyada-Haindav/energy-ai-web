import { useMemo, useState } from "react";
import {
  BookOpenText,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from "lucide-react";

const SUBJECTS = [
  {
    name: "Computer Networks",
    teacher: "Dr. Pavan Kumar",
    completion: 100
  },
  {
    name: "Design and Analysis of Algorithms",
    teacher: "Dr. Saidireddy Malgireddy",
    completion: 100
  }
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function monthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });
}

function startOfGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const day = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - day);
  return start;
}

function buildCalendarCells(date) {
  const start = startOfGrid(date);
  const cells = [];

  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getDate(),
      inMonth: d.getMonth() === date.getMonth(),
      weekday: d.getDay()
    });
  }

  return cells;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function SubjectCard({ subject }) {
  return (
    <article className="overflow-hidden rounded-[22px] bg-white shadow-[0_12px_26px_-24px_rgba(15,23,42,0.65)]">
      <div className="p-5">
        <h3 className="text-[22px] font-semibold leading-tight text-slate-900">{subject.name}</h3>
        <p className="mt-1 text-[14px] text-slate-400">{subject.teacher}</p>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-2.5 w-full rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[#1066c8]" style={{ width: `${subject.completion}%` }} />
          </div>
          <p className="shrink-0 text-[13px] text-slate-500">
            <span className="font-semibold text-slate-800">{subject.completion}%</span> Completed
          </p>
        </div>
      </div>
      <div className="h-6 bg-[#f59c00]" />
    </article>
  );
}

function CalendarCard() {
  const [viewDate, setViewDate] = useState(new Date(2026, 2, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 6));

  const cells = useMemo(() => buildCalendarCells(viewDate), [viewDate]);

  function shiftMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <section className="rounded-[26px] bg-[#f3f4f8] p-6 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.6)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[32px] font-semibold text-[#0f63c9]">Calendar</h2>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5a100] text-white"
        >
          <CalendarDays size={18} />
        </button>
      </div>

      <div className="mb-6 border-t border-slate-200 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1369cd] text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-[30px] font-medium text-slate-800 lg:text-[34px]">{monthLabel(viewDate)}</p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1369cd] text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-4 text-center text-[14px] text-slate-400">
          {WEEKDAYS.map((label) => (
            <p key={label}>{label}</p>
          ))}

          {cells.map((cell) => {
            const dayDate = new Date(cell.iso);
            const selected = isSameDay(dayDate, selectedDate);
            const weekend = cell.weekday === 0 || cell.weekday === 6;

            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setSelectedDate(dayDate)}
                className={`mx-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[18px] transition lg:text-[22px] ${
                  selected
                    ? "bg-[#156fd4] font-semibold text-white"
                    : cell.inMonth
                      ? weekend
                        ? "font-semibold text-slate-900 hover:bg-slate-200"
                        : "text-slate-700 hover:bg-slate-200"
                      : "text-slate-300"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 text-center">
        <p className="text-[18px] text-slate-500 lg:text-[20px]">No upcoming events scheduled</p>
        <p className="mt-1 text-[14px] text-slate-400 lg:text-[15px]">Check back later for new events</p>
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#d8deea] text-slate-900">
      <header className="bg-gradient-to-r from-[#2241a3] to-[#2b59cb]">
        <div className="mx-auto flex h-[68px] w-full max-w-[1500px] items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-4 text-white">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#f5a100] text-[#f5a100]">
              <ClipboardList size={18} />
            </span>
            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">Energy AI Dashboard</h1>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full pl-1 pr-1 text-[#dce3ef] transition hover:bg-white/10"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#c4e7e0] text-base font-bold text-slate-800">
              LH
            </span>
            <ChevronDown size={20} />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-5 pb-12 pt-4 lg:px-8">
        <h2 className="mb-8 text-[48px] font-semibold tracking-[-0.03em] text-slate-900 lg:text-[52px]">Hi, Lyada Haindav</h2>

        <div className="grid gap-6 lg:grid-cols-[2fr_1.06fr]">
          <section>
            <div className="mb-6 flex items-center gap-3 text-[#1269ce]">
              <BookOpenText size={24} />
              <p className="text-[34px] font-medium lg:text-[36px]">My Subjects</p>
            </div>

            <div className="mb-6 grid gap-4 lg:grid-cols-2">
              {SUBJECTS.map((subject) => (
                <SubjectCard key={subject.name} subject={subject} />
              ))}
            </div>

            <section className="relative overflow-hidden rounded-[26px] bg-[#1369cd] p-7 text-white shadow-[0_20px_38px_-30px_rgba(15,23,42,0.72)]">
              <div className="max-w-[60%]">
                <h3 className="text-[48px] font-semibold tracking-[-0.03em] lg:text-[52px]">Career Training</h3>
                <p className="mt-3 text-[28px] leading-tight text-blue-50 lg:text-[30px]">
                  Simulate real interview scenarios with AI-driven prompts. Get instant feedback.
                </p>
                <button
                  type="button"
                  className="mt-7 rounded-2xl bg-[#f5a100] px-6 py-3 text-[26px] font-semibold text-white transition hover:brightness-105 lg:text-[28px]"
                >
                  Launch Module
                </button>
              </div>

              <div className="pointer-events-none absolute -bottom-4 right-10 hidden items-end gap-3 lg:flex">
                <span className="inline-flex h-36 w-36 items-center justify-center rounded-full bg-white/20 text-[64px]">🧑‍💻</span>
                <span className="mb-12 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f2d84c] text-2xl">🤖</span>
              </div>
            </section>
          </section>

          <CalendarCard />
        </div>
      </main>
    </div>
  );
}
