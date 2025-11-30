
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import { Project } from '../types';

interface ProjectLocation {
    lat: number;
    lng: number;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyAyS8VmIL-AbFnpm_xmuKZ-XG8AmSA03AM'; // TODO: Move to environment variables

const MapView: React.FC = () => {
    const { projects } = useData();
    const [locations, setLocations] = useState<Record<number, ProjectLocation>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    // Use `any` for Google Maps types as the 'google' namespace is not defined globally.
    const googleMapRef = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        const geocodeCache: Record<string, ProjectLocation> = {};
        let isMounted = true;

        const geocodeAddress = async (address: string): Promise<ProjectLocation | null> => {
            if (geocodeCache[address]) {
                return geocodeCache[address];
            }
            try {
                const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`);
                if (!response.ok) {
                    console.error(`Geocoding failed for ${address}: ${response.statusText}`);
                    return null;
                }
                const data = await response.json();
                
                if (data.status !== 'OK') {
                    console.warn(`Geocoding API error: ${data.status} - ${data.error_message || ''}`);
                    if (data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT') {
                        setError(`Map API Error: ${data.status}`);
                    }
                    return null;
                }

                if (data.results && data.results.length > 0) {
                    const location = data.results[0].geometry.location;
                    geocodeCache[address] = location;
                    return location;
                }
                return null;
            } catch (err) {
                console.error(`Geocoding network error for ${address}:`, err);
                return null;
            }
        };

        const geocodeAllProjects = async () => {
            setIsLoading(true);
            setError(null);
            const geocodingPromises = projects.map(async (project) => {
                const location = await geocodeAddress(project.address);
                return { projectId: project.id, location };
            });

            const results = await Promise.all(geocodingPromises);
            
            if (isMounted) {
                const newLocations: Record<number, ProjectLocation> = {};
                results.forEach(result => {
                    if (result.location) {
                        newLocations[result.projectId] = result.location;
                    }
                });

                if (Object.keys(newLocations).length === 0 && projects.length > 0 && !error) {
                    // Don't override a critical API error, but warn if no addresses found
                    console.warn('No locations found for projects. Check address formats.');
                }

                setLocations(newLocations);
                setIsLoading(false);
            }
        };

        if (projects.length > 0) {
            geocodeAllProjects();
        } else {
            setIsLoading(false);
        }
        
        return () => { isMounted = false; };
    }, [projects]); // Removed 'error' from dependency to prevent infinite loops

    const locatedProjects = useMemo(() => {
        return projects.filter(p => locations[p.id]);
    }, [projects, locations]);

    useEffect(() => {
        // Safe check for window.google
        if (isLoading || !mapRef.current) return;
        
        const win = window as any;
        if (!win.google || !win.google.maps) {
            setError("Google Maps API failed to load. Please check your internet connection.");
            return;
        }

        try {
            if (!googleMapRef.current) {
                 googleMapRef.current = new win.google.maps.Map(mapRef.current, {
                    center: { lat: 39.8283, lng: -98.5795 },
                    zoom: 4,
                    mapId: 'CONSTRUCT_TRACK_PRO_MAP' 
                });
            }
            
            // Clear old markers
            markersRef.current.forEach(marker => {
                marker.map = null;
            });
            markersRef.current = [];

            if (locatedProjects.length > 0) {
                const bounds = new win.google.maps.LatLngBounds();

                locatedProjects.forEach(project => {
                    const position = locations[project.id];
                    const marker = new win.google.maps.marker.AdvancedMarkerElement({
                        map: googleMapRef.current!,
                        position,
                        title: project.name,
                    });

                    const infoWindow = new win.google.maps.InfoWindow({
                         content: `
                            <div class="font-sans">
                                <h3 class="font-bold text-base mb-1">${project.name}</h3>
                                <p class="text-sm text-gray-600 mb-2">${project.address}</p>
                                <a href="#/projects/${project.id}" class="text-sm font-semibold text-blue-600 hover:underline">
                                    View Details &rarr;
                                </a>
                            </div>
                        `
                    });
                    
                    marker.addListener('click', () => {
                        infoWindow.open(googleMapRef.current!, marker);
                    });

                    markersRef.current.push(marker);
                    bounds.extend(position);
                });

                if (locatedProjects.length > 1) {
                    googleMapRef.current.fitBounds(bounds);
                } else {
                    googleMapRef.current.setCenter(bounds.getCenter());
                    googleMapRef.current.setZoom(12);
                }
            }
        } catch (err) {
            console.error("Error initializing Google Map:", err);
            setError("An error occurred while rendering the map.");
        }

    }, [isLoading, locatedProjects, locations]);


    if (isLoading) {
        return (
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold">Loading Map...</h2>
                    <p className="mt-2 text-gray-600">Finding project locations. This may take a moment.</p>
                </div>
            </Card>
        );
    }
    
    if (projects.length === 0) {
        return (
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold">No Projects to Display</h2>
                    <p className="mt-2 text-gray-600">Add a project to see it on the map.</p>
                </div>
            </Card>
        )
    }

    if (error) {
         return (
            <Card>
                <div className="text-center p-8">
                    <h2 className="text-xl font-bold text-red-600">Map Unavailable</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <p className="mt-1 text-xs text-gray-400">Please check your network connection or API configuration.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Project Map View</h1>
            <Card className="p-2 h-[70vh]">
                <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }} />
            </Card>
        </div>
    );
};

export default MapView;
