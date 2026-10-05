import React from 'react';

/**
 * Component hiển thị mô hình nội thất tạo từ hình khối cơ bản (Code-generated / Procedural Primitives)
 * Đổi màu linh hoạt 100% tức thời theo prop `color` của người dùng.
 */
export function ProceduralFurnitureModel({
  modelType,
  dimensions = {},
  color = '#3b82f6',
  isLightOn = true,
}) {
  const { width = 1, height = 1, depth = 1 } = dimensions;

  switch (modelType) {
    case 'sofa':
    case 'seating': {
      const legHeight = 0.12;
      const cushionHeight = 0.28;
      const backHeight = Math.max(0.2, height - legHeight - cushionHeight);
      const armWidth = 0.18;
      const seatWidth = Math.max(0.3, width - armWidth * 2);

      return (
        <group>
          {/* Đệm ngồi */}
          <mesh position={[0, legHeight + cushionHeight / 2, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[seatWidth, cushionHeight, Math.max(0.2, depth - 0.2)]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* Tựa lưng */}
          <mesh position={[0, legHeight + cushionHeight + backHeight / 2, -depth / 2 + 0.1]} castShadow receiveShadow>
            <boxGeometry args={[width, backHeight, 0.22]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* Tay vịn trái */}
          <mesh position={[-width / 2 + armWidth / 2, legHeight + 0.45 / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[armWidth, 0.45, depth]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* Tay vịn phải */}
          <mesh position={[width / 2 - armWidth / 2, legHeight + 0.45 / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[armWidth, 0.45, depth]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* 4 chân sofa kim loại đen */}
          {[
            [-width / 2 + 0.15, -depth / 2 + 0.15],
            [width / 2 - 0.15, -depth / 2 + 0.15],
            [-width / 2 + 0.15, depth / 2 - 0.15],
            [width / 2 - 0.15, depth / 2 - 0.15],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, legHeight / 2, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.02, legHeight, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    }

    case 'armchair': {
      const legHeight = 0.15;
      return (
        <group>
          {/* Đệm ngồi */}
          <mesh position={[0, legHeight + 0.15, 0]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.3, width - 0.2), 0.2, Math.max(0.3, depth - 0.2)]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* Tựa lưng */}
          <mesh position={[0, legHeight + height / 2, -depth / 2 + 0.1]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.3, width - 0.1), height * 0.7, 0.18]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          {/* 4 Chân ghế */}
          {[
            [-width / 2 + 0.1, -depth / 2 + 0.1],
            [width / 2 - 0.1, -depth / 2 + 0.1],
            [-width / 2 + 0.1, depth / 2 - 0.1],
            [width / 2 - 0.1, depth / 2 - 0.1],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, legHeight / 2, z]} castShadow>
              <cylinderGeometry args={[0.025, 0.02, legHeight, 16]} />
              <meshStandardMaterial color="#78350f" roughness={0.5} />
            </mesh>
          ))}
        </group>
      );
    }

    case 'table':
    case 'dining-table':
    case 'desk': {
      const topThickness = 0.04;
      const legHeight = Math.max(0.1, height - topThickness);
      const legRadius = 0.03;
      const inset = Math.min(width * 0.15, depth * 0.15);

      return (
        <group>
          {/* Mặt bàn */}
          <mesh position={[0, height - topThickness / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, topThickness, depth]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* 4 chân bàn */}
          {[
            [-width / 2 + inset, -depth / 2 + inset],
            [width / 2 - inset, -depth / 2 + inset],
            [-width / 2 + inset, depth / 2 - inset],
            [width / 2 - inset, depth / 2 - inset],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, legHeight / 2, z]} castShadow>
              <cylinderGeometry args={[legRadius, legRadius, legHeight, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      );
    }

    case 'chair': {
      const seatHeight = 0.45;
      const legHeight = seatHeight - 0.03;

      return (
        <group>
          {/* Mặt ghế */}
          <mesh position={[0, seatHeight, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, 0.04, depth]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Tựa lưng */}
          <mesh position={[0, seatHeight + (height - seatHeight) / 2, -depth / 2 + 0.02]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.9, Math.max(0.15, height - seatHeight), 0.03]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* 4 Chân */}
          {[
            [-width / 2 + 0.05, -depth / 2 + 0.05],
            [width / 2 - 0.05, -depth / 2 + 0.05],
            [-width / 2 + 0.05, depth / 2 - 0.05],
            [width / 2 - 0.05, depth / 2 - 0.05],
          ].map(([x, z], idx) => (
            <mesh key={idx} position={[x, legHeight / 2, z]} castShadow>
              <cylinderGeometry args={[0.018, 0.014, legHeight, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.5} />
            </mesh>
          ))}
        </group>
      );
    }

    case 'bed': {
      const frameHeight = 0.3;
      const mattressHeight = 0.25;

      return (
        <group>
          {/* Khung giường */}
          <mesh position={[0, frameHeight / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, frameHeight, depth]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
          {/* Nệm giường */}
          <mesh position={[0, frameHeight + mattressHeight / 2, 0.05]} castShadow receiveShadow>
            <boxGeometry args={[Math.max(0.3, width - 0.1), mattressHeight, Math.max(0.3, depth - 0.15)]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.9} />
          </mesh>
          {/* Đầu giường */}
          <mesh position={[0, height / 2, -depth / 2 + 0.08]} castShadow receiveShadow>
            <boxGeometry args={[width, height, 0.15]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          {/* 2 Gối ngủ */}
          <mesh position={[-width / 4, frameHeight + mattressHeight + 0.06, -depth / 2 + 0.45]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.35]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[width / 4, frameHeight + mattressHeight + 0.06, -depth / 2 + 0.45]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.35]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
        </group>
      );
    }

    case 'storage':
    case 'cabinet':
    case 'wardrobe':
    case 'bookshelf': {
      return (
        <group>
          {/* Thân tủ */}
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Đường chỉ chia cánh tủ */}
          <mesh position={[0, height / 2, depth / 2 + 0.005]}>
            <boxGeometry args={[0.01, height * 0.9, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      );
    }

    case 'lamp': {
      return (
        <group>
          {/* Đế đèn */}
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.04, 32]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          {/* Thân đèn */}
          <mesh position={[0, height * 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, height * 0.9, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          {/* Chao đèn (Chụp đèn hình nón cụt) */}
          <mesh position={[0, height - 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.22, 0.35, 32]} />
            <meshStandardMaterial
              color={color}
              roughness={0.5}
              emissive={isLightOn ? '#fef08a' : '#000000'}
              emissiveIntensity={isLightOn ? 0.4 : 0}
            />
          </mesh>
        </group>
      );
    }

    case 'plant': {
      const potHeight = 0.45;
      const potRadius = 0.22;
      return (
        <group>
          {/* Chậu cây sứ trắng */}
          <mesh position={[0, potHeight / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[potRadius, potRadius * 0.75, potHeight, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          {/* Đất trong chậu */}
          <mesh position={[0, potHeight - 0.02, 0]}>
            <cylinderGeometry args={[potRadius * 0.95, potRadius * 0.95, 0.04, 32]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          {/* Tán lá xanh */}
          <mesh position={[0, potHeight + (height - potHeight) / 2, 0]} castShadow>
            <sphereGeometry args={[width * 0.45, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </group>
      );
    }

    // --- TRANH NGHỆ THUẬT TREO TƯỜNG (WALL ART) ---
    case 'wall-art': {
      const frameThickness = 0.035;
      const canvasW = Math.max(0.1, width - frameThickness * 2);
      const canvasH = Math.max(0.1, height - frameThickness * 2);

      return (
        <group>
          {/* Khung tranh gỗ viền ngoài */}
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {/* Nền tranh Canvas đổi màu nghệ thuật */}
          <mesh position={[0, height / 2, depth / 2 + 0.002]} receiveShadow>
            <planeGeometry args={[canvasW, canvasH]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          {/* Họa tiết nghệ thuật tối giản trên tranh */}
          <mesh position={[0, height / 2, depth / 2 + 0.004]}>
            <circleGeometry args={[Math.min(canvasW, canvasH) * 0.28, 32]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, height / 2 - canvasH * 0.12, depth / 2 + 0.005]}>
            <planeGeometry args={[canvasW * 0.6, 0.015]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} />
          </mesh>
        </group>
      );
    }

    // --- ĐỒNG HỒ TREO TƯỜNG (WALL CLOCK) ---
    case 'wall-clock': {
      const radius = Math.min(width, height) / 2;
      return (
        <group position={[0, height / 2, 0]}>
          {/* Viền ngoài đồng hồ (Trục Z quay hướng ra phòng) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[radius, radius, depth, 36]} />
            <meshStandardMaterial color={color || '#0f172a'} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Mặt số màu trắng ngà */}
          <mesh position={[0, 0, depth / 2 + 0.002]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[radius * 0.88, radius * 0.88, 0.004, 36]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} />
          </mesh>
          {/* Trục kim trung tâm */}
          <mesh position={[0, 0, depth / 2 + 0.012]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Kim giờ (Góc 45 độ) */}
          <mesh
            position={[radius * 0.2, radius * 0.2, depth / 2 + 0.008]}
            rotation={[0, 0, -Math.PI / 4]}
          >
            <boxGeometry args={[0.015, radius * 0.5, 0.004]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          </mesh>
          {/* Kim phút (Thẳng đứng 12h) */}
          <mesh position={[0, radius * 0.32, depth / 2 + 0.01]}>
            <boxGeometry args={[0.01, radius * 0.7, 0.004]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} />
          </mesh>
          {/* 4 vạch chỉ giờ chính (12h, 3h, 6h, 9h) */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
            <mesh
              key={idx}
              position={[
                Math.sin(ang) * (radius * 0.75),
                Math.cos(ang) * (radius * 0.75),
                depth / 2 + 0.004,
              ]}
              rotation={[0, 0, -ang]}
            >
              <boxGeometry args={[0.012, 0.04, 0.003]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          ))}
        </group>
      );
    }

    // --- KỆ GỖ TREO TƯỜNG (WALL SHELF) ---
    case 'wall-shelf': {
      const plankThick = 0.035;
      const bracketW = 0.025;
      const bracketH = Math.max(0.08, height - plankThick);
      const insetX = width * 0.2;

      return (
        <group>
          {/* Tấm gỗ kệ phẳng đặt đồ */}
          <mesh position={[0, height - plankThick / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, plankThick, depth]} />
            <meshStandardMaterial color={color || '#78350f'} roughness={0.5} />
          </mesh>
          {/* 2 Ke đỡ kim loại chữ L phía dưới */}
          {[-width / 2 + insetX, width / 2 - insetX].map((bx, idx) => (
            <group key={idx} position={[bx, 0, 0]}>
              {/* Cạnh đứng áp tường */}
              <mesh position={[0, bracketH / 2, -depth / 2 + 0.015]} castShadow>
                <boxGeometry args={[bracketW, bracketH, 0.015]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Cạnh ngang đỡ đáy ván */}
              <mesh position={[0, bracketH - 0.01, 0]} castShadow>
                <boxGeometry args={[bracketW, 0.015, depth * 0.85]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      );
    }

    // --- CỬA ĐI TẠO TỪ CODE (DOOR) ---
    case 'door': {
      const frameThick = 0.06;
      return (
        <group>
          {/* Khung bao cửa */}
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>
          {/* Cánh cửa */}
          <mesh position={[0, height / 2, 0.005]} castShadow receiveShadow>
            <boxGeometry args={[width - frameThick * 2, height - frameThick, depth * 0.6]} />
            <meshStandardMaterial color={color || '#78350f'} roughness={0.6} />
          </mesh>
          {/* Tay nắm cửa kim loại */}
          <mesh position={[width / 2 - frameThick - 0.08, height * 0.48, depth / 2 + 0.02]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.08, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      );
    }

    // --- CỬA SỔ TẠO TỪ CODE (WINDOW) ---
    case 'window': {
      const frameThick = 0.05;
      const paneW = width - frameThick * 2;
      const paneH = height - frameThick * 2;
      return (
        <group>
          {/* Khung cửa sổ */}
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Mặt kính trong suốt phản chiếu ánh sáng */}
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[paneW, paneH, 0.01]} />
            <meshStandardMaterial
              color="#bae6fd"
              transparent
              opacity={0.35}
              roughness={0.05}
              metalness={0.1}
            />
          </mesh>
          {/* Đố chia ô cửa chữ thập */}
          <mesh position={[0, height / 2, 0.005]}>
            <boxGeometry args={[0.02, paneH, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, height / 2, 0.005]}>
            <boxGeometry args={[paneW, 0.02, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      );
    }

    default:
      return (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      );
  }
}
