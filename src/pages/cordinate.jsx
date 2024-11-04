import React, { useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Text } from "react-konva";
import { SortedSet } from "immutable-sorted";

export default function CoordinateGrid() {
  const gridSize = 720;
  const cellSize = 10;
  const halfGridSize = gridSize / 2;
  const [points, setPoints] = useState([]);
  const [lines, setLines] = useState([]);
  const [steps, setSteps] = useState([]);
  const [displayedSteps, setDisplayedSteps] = useState("");
  const [executionTime, setExecutionTime] = useState("");

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    const point = {
      x: Math.round((mousePos.x - halfGridSize) / cellSize) * cellSize,
      y: Math.round((halfGridSize - mousePos.y) / cellSize) * cellSize,
    };

    if (points.length === 1) {
      setLines([
        ...lines,
        { start: points[0], end: point, color: getRandomColor() },
      ]);
      setPoints([]);
    } else {
      setPoints([point]);
    }
  };

  const handleDeleteLine = (index) => {
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
  };

  const handleFindIntersections = () => {
    const startTime = performance.now();
    const newSteps = [];
    const events = [];

    lines.forEach((line, index) => {
      events.push({
        x: Math.min(line.start.x, line.end.x),
        type: "start",
        index,
      });
      events.push({
        x: Math.max(line.start.x, line.end.x),
        type: "end",
        index,
      });
    });

    events.sort((a, b) => a.x - b.x);
    newSteps.push(
      `SStep 1  Sorting by x : \n${events
        .map(
          (event) =>
            `(${event.x}, ${event.type === "start" ? "left" : "right"}) [line ${
              event.index + 1
            }]`
        )
        .join("\n")}`
    );

    let sortedSegments = new SortedSet();

    const isIntersecting = (segment1, segment2) => {
      const [min, max] = [Math.min, Math.max];
      function ccw(a, b, c) {
        return (b.y - a.y) * (c.x - a.x) - (b.x - a.x) * (c.y - a.y);
      }
      function onSegment(i, j, k) {
        return (
          min(i.x, j.x) <= k.x &&
          k.x <= max(i.x, j.x) &&
          min(i.y, j.y) <= k.y &&
          k.y <= max(i.y, j.y)
        );
      }

      const d1 = ccw(segment2.start, segment2.end, segment1.start);
      const d2 = ccw(segment2.start, segment2.end, segment1.end);
      const d3 = ccw(segment1.start, segment1.end, segment2.start);
      const d4 = ccw(segment1.start, segment1.end, segment2.end);
      if (
        (d1 > 0 && d2 < 0) ||
        (d1 < 0 && d2 > 0) ||
        (d3 > 0 && d4 < 0) ||
        (d3 < 0 && d4 > 0)
      ) {
        return true;
      } else if (
        d1 === 0 &&
        onSegment(segment2.start, segment2.end, segment1.start)
      ) {
        return true;
      } else if (
        d2 === 0 &&
        onSegment(segment2.start, segment2.end, segment1.end)
      ) {
        return true;
      } else if (
        d3 === 0 &&
        onSegment(segment1.start, segment1.end, segment2.start)
      ) {
        return true;
      } else if (
        d4 === 0 &&
        onSegment(segment1.start, segment1.end, segment2.end)
      ) {
        return true;
      } else {
        return false;
      }
    };

    events.forEach((event) => {
      const { type, index } = event;
      if (type === "start") {
        sortedSegments = sortedSegments.add(index);
        newSteps.push(`AAdded line ${index + 1} to sortedSegments`);
        const idx = sortedSegments.toArray().indexOf(index);
        if (idx > 0) {
          newSteps.push(
            `CChecking line ${sortedSegments.toArray()[idx - 1] + 1} and ${
              index + 1
            }`
          );
          if (
            isIntersecting(
              lines[sortedSegments.toArray()[idx - 1]],
              lines[sortedSegments.toArray()[idx]]
            )
          ) {
            newSteps.push(
              `LLine ${sortedSegments.toArray()[idx - 1] + 1} and ${
                index + 1
              } are intersecting`
            );
          } else {
            newSteps.push(
              `LLine ${sortedSegments.toArray()[idx - 1] + 1} and ${
                index + 1
              } are not intersecting `
            );
          }
        }
        if (idx < sortedSegments.toArray().length - 1) {
          newSteps.push(
            `CChecking line ${index + 1} and ${
              sortedSegments.toArray()[idx + 1] + 1
            }`
          );
          if (
            isIntersecting(
              lines[sortedSegments.toArray()[idx]],
              lines[sortedSegments.toArray()[idx + 1]]
            )
          ) {
            newSteps.push(
              `LLine ${index + 1} and ${
                sortedSegments.toArray()[idx + 1] + 1
              } are intersecting`
            );
          } else {
            newSteps.push(
              `LLine ${index + 1} and  ${
                sortedSegments.toArray()[idx + 1] + 1
              } are not intersecting`
            );
          }
        }
      } else if (type === "end") {
        const idx = sortedSegments.toArray().indexOf(index);
        if (idx > 0 && idx < sortedSegments.toArray().length - 1) {
          newSteps.push(
            `CChecking line ${sortedSegments.toArray()[idx - 1] + 1} and ${
              sortedSegments.toArray()[idx + 1] + 1
            }`
          );
          if (
            isIntersecting(
              lines[sortedSegments.toArray()[idx - 1]],
              lines[sortedSegments.toArray()[idx + 1]]
            )
          ) {
            newSteps.push(
              `LLine ${sortedSegments.toArray()[idx - 1] + 1} and ${
                sortedSegments.toArray()[idx + 1] + 1
              } are intersecting`
            );
          } else {
            newSteps.push(
              `LLine ${sortedSegments.toArray()[idx - 1] + 1} and ${
                sortedSegments.toArray()[idx + 1] + 1
              } are not intersecting`
            );
          }
        }
        sortedSegments = sortedSegments.delete(index);
        newSteps.push(`DDeleted line ${index + 1} from sortedSegments`);
      }
    });

    setSteps(newSteps);
    setDisplayedSteps("");

    const endTime = performance.now();
    setExecutionTime(
      `زمان اجرای الگوریتم: ${(endTime - startTime).toFixed(2)} میلی‌ثانیه`
    );
  };

  useEffect(() => {
    if (steps.length > 0) {
      let index = 0;
      let charIndex = 0;
      const interval = setInterval(() => {
        if (index < steps.length) {
          if (charIndex < steps[index].length) {
            setDisplayedSteps(
              (prevDisplayedSteps) =>
                prevDisplayedSteps + steps[index][charIndex]
            );
            charIndex++;
          } else {
            charIndex = 0;
            index++;
            if (index < steps.length) {
              setDisplayedSteps(
                (prevDisplayedSteps) => prevDisplayedSteps + "\n"
              );
            }
          }
        } else {
          clearInterval(interval);
        }
      }, 10);

      return () => {
        clearInterval(interval);
      };
    }
  }, [steps]);

  useEffect(() => {
    if (displayedSteps.endsWith("undefined")) {
      setDisplayedSteps((prev) => prev.replace(/undefined$/g, ""));
    }
  }, [displayedSteps]);

  return (
    <div className="flex">
      <Stage
        width={gridSize}
        height={gridSize}
        onClick={handleStageClick}
        className="m-0 p-0"
      >
        <Layer>
          <Line
            points={[halfGridSize, 0, halfGridSize, gridSize]}
            stroke="black"
            strokeWidth={2}
          />
          <Line
            points={[0, halfGridSize, gridSize, halfGridSize]}
            stroke="black"
            strokeWidth={2}
          />

          {[...Array(gridSize / cellSize)].map((_, i) => (
            <React.Fragment key={i}>
              <Line
                points={[i * cellSize, 0, i * cellSize, gridSize]}
                stroke="#efefef"
                strokeWidth={1}
              />
              <Line
                points={[0, i * cellSize, gridSize, i * cellSize]}
                stroke="#efefef"
                strokeWidth={1}
              />
            </React.Fragment>
          ))}

          {lines.map((line, index) => (
            <React.Fragment key={index}>
              <Line
                points={[
                  line.start.x + halfGridSize,
                  halfGridSize - line.start.y,
                  line.end.x + halfGridSize,
                  halfGridSize - line.end.y,
                ]}
                stroke={line.color}
                strokeWidth={2}
              />
              <Text
                x={(line.start.x + line.end.x) / 2 + halfGridSize}
                y={halfGridSize - (line.start.y + line.end.y) / 2}
                text={`خط ${index + 1}`}
                fontSize={15}
                fill="black"
              />
            </React.Fragment>
          ))}

          {points.map((point, index) => (
            <Circle
              key={index}
              x={point.x + halfGridSize}
              y={halfGridSize - point.y}
              radius={5}
              fill="blue"
            />
          ))}
        </Layer>
      </Stage>

      <div className="ml-5">
        <h3>جدول نقاط شروع و پایان خطوط</h3>
        <table className="border border-collapse border-black p-2">
          <thead>
            <tr>
              <th className="border p-2">شماره خط</th>
              <th className="border p-2">نقطه شروع (x, y)</th>
              <th className="border p-2">نقطه پایان (x, y)</th>
              <th className="border p-2">حذف خط</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">
                  ({line.start.x}, {line.start.y})
                </td>
                <td className="border p-2">
                  ({line.end.x}, {line.end.y})
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteLine(index)}
                    className="bg-red-500 text-white p-1 rounded"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleFindIntersections}
          className="mt-4 bg-blue-500 text-white p-2 rounded"
        >
          پیدا کردن خطوط متقاطع
        </button>
        <div className="mt-5 max-h-64 overflow-y-auto">
          <h3>مراحل اجرای الگوریتم</h3>
          <pre className="bg-gray-200 p-4 rounded whitespace-pre-wrap font-[Vazirmatn]">
            {displayedSteps ||
              "در حال حاضر هیچ مرحله‌ای برای نمایش وجود ندارد."}
          </pre>
        </div>
        <div className="mt-5">
          <h3>زمان اجرای الگوریتم</h3>
          <pre className="bg-green-200 p-4 rounded whitespace-pre-wrap font-[Vazirmatn]">
            {executionTime}
          </pre>
        </div>
      </div>
    </div>
  );
}
