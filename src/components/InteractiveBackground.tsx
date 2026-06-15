"use client"

import React, { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, Sphere, Box, Torus, Stars } from "@react-three/drei"
import * as THREE from "three"

type Variant = "auth" | "home" | "chat" | "likes" | "profile" | "default"

function Shape({ variant }: { variant: Variant }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  // We use our Tailwind colors: primary (FFD700), secondary (FFA500)
  const color = variant === 'auth' ? '#FFD700' : variant === 'chat' ? '#FFA500' : '#FFD27F'

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      {variant === 'auth' && (
        <Sphere ref={meshRef as any} args={[1.5, 64, 64]} position={[0, 0, 0]}>
          <meshStandardMaterial color={color} wireframe />
        </Sphere>
      )}
      {variant === 'home' && (
        <Torus ref={meshRef as any} args={[1.2, 0.4, 32, 100]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#FFD700" wireframe />
        </Torus>
      )}
      {variant === 'chat' && (
        <Box ref={meshRef as any} args={[2, 2, 2]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#FFA500" wireframe />
        </Box>
      )}
      {(variant === 'likes' || variant === 'profile' || variant === 'default') && (
        <Sphere ref={meshRef as any} args={[1, 32, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#FFD700" wireframe />
        </Sphere>
      )}
    </Float>
  )
}

function CursorLight() {
  const lightRef = useRef<THREE.PointLight>(null)
  
  useFrame((state) => {
    if (lightRef.current) {
      const x = (state.pointer.x * state.viewport.width) / 2
      const y = (state.pointer.y * state.viewport.height) / 2
      lightRef.current.position.set(x, y, 2)
    }
  })

  return <pointLight ref={lightRef} distance={5} intensity={5} color="#FFD700" />
}

export function InteractiveBackground({ variant = "default" }: { variant?: Variant }) {
  return (
    <div className="fixed inset-0 z-[-1] bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <CursorLight />
        
        {/* Render a bunch of background stars/particles */}
        <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {/* Main shape */}
        <Shape variant={variant} />
        
        {/* Secondary distant shapes for depth */}
        <group position={[-3, -2, -4]}>
          <Float speed={1} floatIntensity={1}>
             <Sphere args={[0.5, 16, 16]}>
               <meshStandardMaterial color="#FFA500" wireframe opacity={0.3} transparent />
             </Sphere>
          </Float>
        </group>
        <group position={[3, 2, -5]}>
          <Float speed={1.5} floatIntensity={2}>
             <Box args={[1, 1, 1]}>
               <meshStandardMaterial color="#FFD700" wireframe opacity={0.3} transparent />
             </Box>
          </Float>
        </group>
      </Canvas>
    </div>
  )
}
