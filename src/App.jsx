import "./styles.css";
import React, { useState, useEffect } from "react";
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Tile as TileLayer } from 'ol/layer';
import OSM from 'ol/source/OSM';
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Feature } from 'ol';
import { Point } from 'ol/geom';


export default function App() {

  const [coordinates, setCoordinates] = useState([]);

  useEffect(() => {
    // Initialize the map
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([39.71230328261182, 47.2371969319224]), // start coordinates
        zoom: 5,
      }),
      controls: []
    });

    // Create a vector layer for the drawn features
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    map.addLayer(vectorLayer);

    // Add draw interaction for points
    const draw = new Draw({
      source: vectorSource,
      type: 'Point',
    });

    map.addInteraction(draw);
    draw.on('drawend', (event) => {
      vectorSource.clear();

      const geom = event.feature.getGeometry();
      const coords = geom.getCoordinates();
      const lonLatCoords = toLonLat(coords);

      setCoordinates([{
        lon: lonLatCoords[0],
        lat: lonLatCoords[1]
      }]);

      vectorSource.addFeature(new Feature(geom));
    });

    return () => map.setTarget(undefined);
  }, []);


  const [culture, setCulture] = useState('');
  const [areaSize, setAreaSize] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!coordinates.length || !culture || !areaSize) {
      alert('Пожалуйста, заполните все поля!');
      return;
    }

    const formData = {
      coordinates: coordinates,
      culture: culture,
      areaSize: areaSize,
    };

    console.log('Form submitted with:', { coordinates, culture, areaSize });

    try {
      const response = await fetch('http://localhost:1323/api/calculate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
      });

      if (!response.ok) {
          throw new Error('Ошибка при отправке данных');
      }

      const result = await response.json();
      console.log('Ответ от сервера:', result);
      alert(result.message); 
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при отправке данных');
    }
  };


  return (
    <>
      <h1>Агрокалькулятор</h1>

      <form className="new-item-form" onSubmit={handleSubmit}>

        <div className="form-row">
          <label htmlFor="culture-select">Выберите агрокультуру</label>
          <select 
          name="culture" 
          id="culture-select"
          value={culture}
          onChange={(e) => setCulture(e.target.value)}
          >
            <option value="" disabled selected>Выберите</option>
            <option value="tomato">Помидор</option>
            <option value="carrot">Морковь</option>
            <option value="potato">Картофель</option>
          </select>
        </div>

        <div className="form-row">
        <label htmlFor="areasize-select">Укажите размер участка в га</label>
        <input 
        name="areasize" 
        id="areasize-select" 
        type="number" 
        placeholder={0} 
        min={0}
        value={areaSize}
        onChange={(e) => setAreaSize(e.target.value)}
        >
        </input>
        </div>

        <div className="form-row">
          <label>Выберите место выращивания культуры на карте:</label>
          <div id="map" style={{ width: '100%', height: '400px' }}></div>
          {coordinates.length > 0 && (
            <div>
              <h3>Координаты:</h3>
              <pre>{JSON.stringify(coordinates, null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="form-row">
          <button className="btn" type="submit">Посчитать</button>
        </div>

      </form>
    </>
  );
}