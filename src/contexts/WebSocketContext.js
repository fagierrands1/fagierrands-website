import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orderLocations, setOrderLocations] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null); // Use a ref to track the current socket

  // Connect to WebSocket for a specific order
  const connectToOrder = useCallback((orderId) => {
    if (!orderId) return;
    
    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    try {
      // Create WebSocket connection
      const ws = new WebSocket(`wss://fagierrands-backend-xwqi.onrender.com/ws/locations/order/${orderId}/?token=${token}`);
      socketRef.current = ws; // Store in ref for cleanup
      
      ws.onopen = () => {
        console.log(`WebSocket connected for order ${orderId}`);
        setConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'initial_locations') {
            // Initial data when connecting
            setOrderLocations(data.locations.users || []);
            setWaypoints(data.locations.waypoints || []);
          } 
          else if (data.type === 'location_update') {
            // Update a specific user's location
            setOrderLocations(prev => {
              // Check if prev is an array before proceeding
              if (!Array.isArray(prev)) {
                // If prev is not an array, initialize with an empty array
                const newLocation = {
                  user_id: data.user_id,
                  username: data.username,
                  user_type: data.user_type,
                  latitude: data.latitude,
                  longitude: data.longitude,
                  heading: data.heading,
                  speed: data.speed,
                  accuracy: data.accuracy,
                  last_updated: new Date().toISOString()
                };
                return [newLocation];
              }
              
              // Create a new array to avoid mutation
              const updatedLocations = [...prev];
              const userIndex = updatedLocations.findIndex(u => u.user_id === data.user_id);
              
              if (userIndex >= 0) {
                updatedLocations[userIndex] = {
                  ...updatedLocations[userIndex],
                  latitude: data.latitude,
                  longitude: data.longitude,
                  heading: data.heading,
                  speed: data.speed,
                  accuracy: data.accuracy,
                  last_updated: new Date().toISOString()
                };
              } else {
                updatedLocations.push({
                  user_id: data.user_id,
                  username: data.username,
                  user_type: data.user_type,
                  latitude: data.latitude,
                  longitude: data.longitude,
                  heading: data.heading,
                  speed: data.speed,
                  accuracy: data.accuracy,
                  last_updated: new Date().toISOString()
                });
              }
              
              return updatedLocations;
            });
          } 
          else if (data.type === 'waypoint_update') {
            // Update a specific waypoint
            setWaypoints(prev => {
              // Check if prev is an array before proceeding
              if (!Array.isArray(prev)) {
                return []; // Return empty array if prev is not an array
              }
              
              const updatedWaypoints = [...prev];
              const waypointIndex = updatedWaypoints.findIndex(w => w.id === data.waypoint_id);
              
              if (waypointIndex >= 0) {
                updatedWaypoints[waypointIndex] = {
                  ...updatedWaypoints[waypointIndex],
                  is_visited: data.is_visited,
                  visited_at: data.is_visited ? new Date().toISOString() : null
                };
              }
              
              return updatedWaypoints;
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
      };
      
      ws.onerror = (err) => {
        console.log('WebSocket connection failed - this is normal if WebSocket server is not available');
        setError('WebSocket not available - using polling instead');
        setConnected(false);
      };
      
      setSocket(ws);
      
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to connect');
    }
  }, []);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  }, []);
  
  // Send location update
  const sendLocationUpdate = useCallback((latitude, longitude, heading = null, speed = null, accuracy = null) => {
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify({
        type: 'update_location',
        latitude,
        longitude,
        heading,
        speed,
        accuracy
      }));
    }
  }, [connected]);
  
  // Mark waypoint as visited
  const markWaypointVisited = useCallback((waypointId) => {
    if (socketRef.current && connected) {
      socketRef.current.send(JSON.stringify({
        type: 'waypoint_visited',
        waypoint_id: waypointId
      }));
    }
  }, [connected]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
  
  const value = {
    connected,
    orderLocations,
    waypoints,
    error,
    connectToOrder,
    disconnect,
    sendLocationUpdate,
    markWaypointVisited
  };
  
  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};