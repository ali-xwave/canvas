"use client";
import React, { useState, useRef, useEffect } from "react";
import CanvasDraw from "react-canvas-draw";

type Rectangle = {
  startX: number;
  startY: number;
  width: number;
  height: number;
  color: string;
};

interface CanvasDrawWithCanvas extends CanvasDraw {
  canvas: {
    drawing: {
      toDataURL: () => string;
    };
  };
}

const DrawPage: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<CanvasDrawWithCanvas | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 300, height: 300 });
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [color, setColor] = useState<string>("black");

  useEffect(() => {
    const canvas = canvasOverlayRef.current;
    if (canvas) {
      canvas.width = canvasDimensions.width;
      canvas.height = canvasDimensions.height;
      const context = canvas.getContext("2d");
      contextRef.current = context;
    }
  }, [canvasDimensions]);

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setRectangles([]);
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
    }
  };

  const undoLast = () => {
    if (rectangles.length > 0) {
      const newRectangles = rectangles.slice(0, -1);
      setRectangles(newRectangles);
      redrawRectangles(newRectangles);
    }
  };

  const redrawRectangles = (rectanglesToRedraw: Rectangle[]) => {
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      rectanglesToRedraw.forEach((rect) => {
        contextRef.current!.strokeStyle = rect.color;
        contextRef.current?.strokeRect(rect.startX, rect.startY, rect.width, rect.height);
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            setImageSrc(reader.result as string);
            setCanvasDimensions({ width: img.width, height: img.height });
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveDrawing = () => {
    if (canvasRef.current) {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasDimensions.width;
      tempCanvas.height = canvasDimensions.height;
      const ctx = tempCanvas.getContext("2d");

      if (ctx) {
        if (imageSrc) {
          const backgroundImg = new Image();
          backgroundImg.src = imageSrc;
          backgroundImg.onload = () => {
            ctx.drawImage(backgroundImg, 0, 0, canvasDimensions.width, canvasDimensions.height);
            const drawing = (canvasRef.current as CanvasDrawWithCanvas).canvas.drawing.toDataURL(); // Use type assertion here

            if (drawing) {
              const drawingImg = new Image();
              drawingImg.src = drawing;
              drawingImg.onload = () => {
                ctx.drawImage(drawingImg, 0, 0, canvasDimensions.width, canvasDimensions.height);
                rectangles.forEach((rect) => {
                  ctx.strokeStyle = rect.color;
                  ctx.lineWidth = 2;
                  ctx.strokeRect(rect.startX, rect.startY, rect.width, rect.height);
                });
                const finalImage = tempCanvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = finalImage;
                link.download = "drawing.png";
                link.click();
              };
            }
          };
        }
      }
    }
  };

  const startDrawingRectangle = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvasBounds = canvasOverlayRef.current?.getBoundingClientRect();
    if (canvasBounds) {
      startX.current = event.clientX - canvasBounds.left;
      startY.current = event.clientY - canvasBounds.top;
      setIsDrawing(true);
    }
  };

  const drawRectangle = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;

    const canvasBounds = canvasOverlayRef.current?.getBoundingClientRect();
    if (canvasBounds) {
      const currentX = event.clientX - canvasBounds.left;
      const currentY = event.clientY - canvasBounds.top;
      const width = currentX - startX.current;
      const height = currentY - startY.current;

      contextRef.current.clearRect(0, 0, canvasDimensions.width, canvasDimensions.height);
      redrawRectangles(rectangles);
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = 5;
      contextRef.current.strokeRect(startX.current, startY.current, width, height);
    }
  };

  const stopDrawingRectangle = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvasBounds = canvasOverlayRef.current?.getBoundingClientRect();
    if (canvasBounds) {
      const currentX = event.clientX - canvasBounds.left;
      const currentY = event.clientY - canvasBounds.top;
      const width = currentX - startX.current;
      const height = currentY - startY.current;
      setRectangles((prev) => [
        ...prev,
        { startX: startX.current, startY: startY.current, width, height, color },
      ]);
    }
  };

  const selectColor = (newColor: string) => {
    setColor(newColor);
  };

  return (
    <div style={{ padding: "20px" }}>
      <label htmlFor="image-upload">Upload Background Image: </label>
      <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} />

      {/* Color Buttons */}
      <div>
        <div className="button-container">
          <button onClick={() => selectColor("red")}>Main Statement</button>
          <button onClick={() => selectColor("green")}>Child Statement</button>
          <button onClick={() => selectColor("blue")}>Question</button>
          <button onClick={() => selectColor("#8B4513")}>Image</button>
          <button onClick={() => selectColor("#C71585")}>Marking Scheme</button>
          <button onClick={() => selectColor("yellow")} className="yellow-button">Marking Scheme Image</button>
        </div>
        <div style={{ marginTop: "10px" }}>
          <button onClick={clearCanvas}>Clear</button>
          <button onClick={undoLast}>Undo</button>
          <button onClick={saveDrawing}>Save</button>
        </div>

        {/* Canvas Section */}
        <div style={{ position: "relative" }}>
          <div style={{ marginTop: "20px", padding: "10px" }}>
            <CanvasDraw
              ref={canvasRef}
              brushColor="black"
              canvasWidth={canvasDimensions.width}
              canvasHeight={canvasDimensions.height}
              imgSrc={imageSrc || undefined}
            />
          </div>
          <canvas
            ref={canvasOverlayRef}
            onMouseDown={startDrawingRectangle}
            onMouseMove={drawRectangle}
            onMouseUp={stopDrawingRectangle}
            onMouseLeave={stopDrawingRectangle}
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              border: "1px solid transparent",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DrawPage;
