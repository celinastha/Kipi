import React, { useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import './calender.css';

const GOOGLE_API_KEY = "AIzaSyBN-TexpYXjYglz6uLKJA6zJMKhlBn0BHM";
const HOLIDAY_CAL_ID = "en.usa#holiday@group.v.calendar.google.com";

export default function CalenderPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dayCalRef = useRef(null);

  // your app’s events
  const myEvents = useMemo(
    () => [
      { title: "Study session", start: "2025-05-03T10:00:00", classNames: ["work"] },
      { title: "Workout", start: "2025-05-03T17:30:00", classNames: ["task"] },
    ],
    []
  );

  const eventSources = [
    { events: myEvents },
    { googleCalendarId: HOLIDAY_CAL_ID, classNames: ["holiday"] },
  ];

  const onDateClick = (info) => {
    setSelectedDate(info.date);
    const api = dayCalRef.current?.getApi?.();
    if (api) api.gotoDate(info.date);
  };

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(selectedDate);
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(selectedDate);
  const dayNum = String(selectedDate.getDate()).padStart(2, "0");

  return (
    <div className="CalenderPage">
      {/* LEFT: mini-month only */}
      <aside className="calender-sidebar">
        <h2 className="side-title">Calendar</h2>

        <div className="month-mini">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, googleCalendarPlugin]}
            headerToolbar={false}
            initialView="dayGridMonth"
            initialDate={selectedDate}
            fixedWeekCount={false}
            height="auto"
            googleCalendarApiKey={GOOGLE_API_KEY}
            events={myEvents}
            eventSources={eventSources}
            dateClick={onDateClick}
            dayMaxEvents={2}
            // show tiny dots instead of full pills
            eventContent={() => ({ html: '<span class="fc-dot"></span>' })}
          />
        </div>

        <div className="legend">
          <div><span className="dot work"></span>Work</div>
          <div><span className="dot personal"></span>Personal</div>
          <div><span className="dot task"></span>Task</div>
          <div><span className="dot holiday"></span>Holiday</div>
        </div>
      </aside>

      <section className="day-view">
        {/* TOP DATE HEADER (right column) */}
        <div className="day-header">
          <div className="month-top">{monthLabel}</div>
          <div className="big-day-wrap">
            <div className="big-day">{dayNum}</div>
            <div className="big-day-sub">{weekday}</div>
          </div>
          <div className="divider" />
        </div>

        {/* Agenda body */}
        <div className="day-body">
         <FullCalendar
          ref={dayCalRef}
          plugins={[listPlugin, googleCalendarPlugin]}
          headerToolbar={false}
          initialView="listDay"
          initialDate={selectedDate}
          googleCalendarApiKey={GOOGLE_API_KEY}
          events={myEvents}
          eventSources={eventSources}
          noEventsContent={() => <div className="event-card no-events">No events</div>}
          eventClassNames={(arg) => arg.event.classNames}
          height="100%"
        />
      </div>
    </section>
    </div>
    );
  }
