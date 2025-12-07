// CalenderPage.jsx
import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import "./calender.css";

const EVENTS_STORAGE_KEY = "calendar-events-v1";

export default function CalenderPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayCalRef = useRef(null);

  // events in state (loaded from localStorage)
  const [events, setEvents] = useState(() => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load events from localStorage", e);
    }
    // fallback sample events
    return [
      {
        id: "1",
        title: "Study session",
        start: "2025-11-24T10:00:00",
        classNames: ["work"],
        location: "Library",
      },
      {
        id: "2",
        title: "Workout",
        start: "2025-11-24T17:30:00",
        classNames: ["task"],
        location: "Campus Gym",
      },
    ];
  });

  // persist events to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.error("Failed to save events to localStorage", e);
    }
  }, [events]);

  // form state
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("work");
  const [newLocation, setNewLocation] = useState("");

  // editing & menu state
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [menuOpenId, setMenuOpenId] = useState(null); // which event menu is open

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const eventSources = [
    {
      googleCalendarId: import.meta.env.HOLIDAY_CAL_ID,
      classNames: ["holiday"],
    },
  ];

  const onDateClick = (info) => {
    setSelectedDate(info.date);
    const api = dayCalRef.current?.getApi?.();
    if (api) api.gotoDate(info.date);
  };

  // add or save event
  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const dateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    const dateStr = dateOnly.toISOString().slice(0, 10); // "YYYY-MM-DD"

    let start = `${dateStr}T09:00:00`;
    if (newTime) {
      start = `${dateStr}T${newTime}:00`;
    }

    const baseData = {
      title: newTitle.trim(),
      start,
      classNames: [newType],
      location: newLocation.trim() || undefined,
    };

    if (editingId) {
      // update existing
      setEvents((prev) =>
        prev.map((ev) => (ev.id === editingId ? { ...ev, ...baseData } : ev))
      );
    } else {
      // add new
      const newEvent = {
        id: Date.now().toString(),
        ...baseData,
      };
      setEvents((prev) => [...prev, newEvent]);
    }

    // reset form
    setNewTitle("");
    setNewTime("");
    setNewType("work");
    setNewLocation("");
    setEditingId(null);
  };

  const startEditEvent = (ev) => {
    setEditingId(ev.id);
    setMenuOpenId(null);

    setNewTitle(ev.title || "");
    setNewLocation(ev.location || "");
    setNewType(ev.classNames?.[0] || "work");

    if (ev.start) {
      const d = new Date(ev.start);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setNewTime(`${hh}:${mm}`);
      setSelectedDate(d);
    } else {
      setNewTime("");
    }
  };

  const handleDeleteEvent = (id) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    setMenuOpenId(null);
    if (editingId === id) {
      cancelEdit();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewTitle("");
    setNewTime("");
    setNewLocation("");
    setNewType("work");
  };

  const eventsForSelectedDay = events.filter((ev) => {
    if (!ev.start) return false;
    const d = new Date(ev.start);
    return isSameDay(d, selectedDate);
  });

  const formatEventDate = (start) => {
    const d = new Date(start);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  };

  const formatEventTime = (start) => {
    const d = new Date(start);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  };

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(selectedDate);
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  }).format(selectedDate);
  const dayNum = String(selectedDate.getDate()).padStart(2, "0");

  return (
    <div className="CalenderPage">
      {/* LEFT: mini month */}
      <aside className="calender-sidebar">
        <h2 className="side-title">Calendar</h2>

        <div className="month-mini">
          <FullCalendar
            key={selectedDate.toDateString()}
            plugins={[dayGridPlugin, interactionPlugin, googleCalendarPlugin]}
            headerToolbar={false}
            initialView="dayGridMonth"
            initialDate={selectedDate}
            fixedWeekCount={false}
            height="auto"
            googleCalendarApiKey={import.meta.env.GOOGLE_API_KEY}
            events={events}
            eventSources={eventSources}
            dateClick={onDateClick}
            dayMaxEvents={2}
            eventContent={() => ({ html: '<span class="fc-dot"></span>' })}
            dayCellClassNames={(arg) =>
              isSameDay(arg.date, selectedDate) ? ["mini-selected-day"] : []
            }
          />
        </div>

        <div className="legend">
          <div><span className="dot work"></span>Work</div>
          <div><span className="dot personal"></span>Personal</div>
          <div><span className="dot task"></span>Task</div>
          <div><span className="dot holiday"></span>Holiday</div>
        </div>
      </aside>

      {/* RIGHT: events list */}
      <section className="day-view">
        <div className="day-header">
          <div className="month-top">{monthLabel}</div>
          <div className="big-day-wrap">
            <div className="big-day">{dayNum}</div>
            <div className="big-day-sub">{weekday}</div>
          </div>
          <div className="divider" />
        </div>

        <div className="day-body">
          {/* add/edit event form */}
          <form className="event-form" onSubmit={handleSubmitEvent}>
            <div className="event-form-row">
              <input
                type="text"
                placeholder="Event"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <input
                type="text"
                placeholder="Location"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="task">Task</option>
              </select>
              <button type="submit">
                {editingId ? "Save" : "Add"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="event-cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="event-form-hint">
              Event will be {editingId ? "saved" : "added"} on{" "}
              <strong>{monthLabel} {dayNum}</strong>
            </div>
          </form>

          <div className="events-section">
            <div className="events-header">
              <h3>Events</h3>
            </div>

            {eventsForSelectedDay.length === 0 ? (
              <div className="event-card-row no-events-row">
                No events for this day
              </div>
            ) : (
              <div className="events-list">
                {eventsForSelectedDay.map((ev) => (
                  <div
                    key={ev.id}
                    className={`event-card-row ${ev.classNames?.[0] || ""}`}
                  >
                    <div className="event-icon">
                      {ev.classNames?.[0] === "personal"
                        ? "😊"
                        : ev.classNames?.[0] === "task"
                        ? "✔️"
                        : "📅"}
                    </div>

                    <div className="event-main">
                      <div className="event-title">{ev.title}</div>
                      <div className="event-sub">
                        {formatEventDate(ev.start)}
                      </div>
                    </div>

                    <div className="event-time">
                      {formatEventTime(ev.start)}
                    </div>

                    {ev.location && (
                      <div className="event-location">{ev.location}</div>
                    )}

                    {/* 3-dot menu */}
                    <div className="event-menu-wrapper">
                      <button
                        type="button"
                        className="event-menu-dots"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(
                            menuOpenId === ev.id ? null : ev.id
                          );
                        }}
                      >
                        ⋯
                      </button>

                      {menuOpenId === ev.id && (
                        <div className="event-menu">
                          <button
                            type="button"
                            className="edit"
                            onClick={() => startEditEvent(ev)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="delete"
                            onClick={() => handleDeleteEvent(ev.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
