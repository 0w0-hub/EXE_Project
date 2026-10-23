/**
 * Suy ra toạ độ (x, z) trong phòng từ mô tả vị trí tự do bằng tiếng Việt
 * (ví dụ: "Góc phòng, gần cửa sổ") vì backend chỉ lưu `position` dạng text,
 * không có toạ độ thật. Đây là heuristic hiển thị, không chính xác tuyệt đối.
 * Hàm thuần (không phụ thuộc DOM/three.js) để dễ test độc lập.
 */
export function resolveFurniturePosition(positionText, index, total, widthMeters, lengthMeters) {
  const margin = 0.5
  const halfW = Math.max(widthMeters / 2 - margin, 0.3)
  const halfL = Math.max(lengthMeters / 2 - margin, 0.3)
  const text = (positionText || '').toLowerCase()

  const hasLeft = /trái/.test(text)
  const hasRight = /phải/.test(text)
  const hasCenter = /trung tâm|giữa|center/.test(text)
  const hasCorner = /góc/.test(text)
  const hasWindow = /cửa sổ/.test(text)
  const hasOppositeEntrance = /đối diện lối vào|lối vào/.test(text)
  const hasWall = /tường/.test(text)

  let x = spreadX(index, total, halfW)
  let z = -halfL * 0.6

  if (hasCenter) {
    x = 0
    z = 0
  } else {
    if (hasLeft) x = -halfW * 0.75
    else if (hasRight) x = halfW * 0.75

    if (hasCorner) {
      z = -halfL * 0.85
      if (!hasLeft && !hasRight) x = (index % 2 === 0 ? -1 : 1) * halfW * 0.85
    } else if (hasOppositeEntrance || hasWall) {
      z = -halfL * 0.85
    } else if (hasWindow) {
      z = -halfL * 0.2
    }
  }

  return {
    x: clamp(x, -halfW, halfW),
    z: clamp(z, -halfL, halfL),
  }
}

/** Vị trí mặc định khi text không khớp keyword nào — dàn đều theo chiều rộng để tránh chồng lấp. */
function spreadX(index, total, halfW) {
  if (total <= 1) return 0
  return -halfW + (index / (total - 1)) * 2 * halfW
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Suy ra toạ độ cho TOÀN BỘ nội thất trong 1 phòng, có xử lý chồng lấn.
 * Vì heuristic text-matching ở trên khá thô (vd "góc phòng" và "sát tường" đều
 * suy ra z gần mép sau phòng), nhiều món có thể vô tình rơi trúng cùng 1 vị trí và
 * che khuất nhau (đã gặp thật: đèn sàn bị khuất sau kệ sách vì cả 2 cùng z và x gần
 * bằng nhau). Bước dàn đều dưới đây gom các món có z gần nhau (cùng "hàng" theo
 * chiều sâu phòng) rồi trải đều theo trục x dựa theo kích thước thật của từng món.
 *
 * TASK-032: nếu 1 "hàng" có quá nhiều món (vd user tự thêm nhiều món mới cùng mô tả
 * "góc"/"sát tường" — xem Room3DViewer.jsx#CUSTOM_FURNITURE_PRESETS) khiến tổng bề rộng
 * vượt quá chiều rộng phòng khả dụng, dàn đều theo 1 trục x duy nhất sẽ làm các món bị
 * ép sát/chồng mép nhau. Xử lý bằng cách "xuống hàng" — tách thành nhiều hàng con, mỗi
 * hàng lùi dần về phía tâm phòng theo trục z (không xuyên tường).
 */
export function resolveFurniturePositions(items, widthMeters, lengthMeters) {
  const total = items.length
  const margin = 0.5
  const halfW = Math.max(widthMeters / 2 - margin, 0.3)
  const halfL = Math.max(lengthMeters / 2 - margin, 0.3)
  const zTolerance = 0.4
  const minGap = 0.2

  const entries = items.map((item, index) => ({
    ...resolveFurniturePosition(item.position, index, total, widthMeters, lengthMeters),
    size: furnitureSize(item.category),
    index,
  }))

  const rows = []
  entries.forEach((entry) => {
    const row = rows.find((r) => Math.abs(r.z - entry.z) < zTolerance)
    if (row) row.entries.push(entry)
    else rows.push({ z: entry.z, entries: [entry] })
  })

  const span = halfW * 2
  rows.forEach((row) => {
    if (row.entries.length < 2) return
    row.entries.sort((a, b) => a.x - b.x)

    // Xếp lần lượt vào hàng con hiện tại; hết chỗ (vượt `span`) thì mở hàng con mới.
    const subRows = []
    let current = []
    let currentWidth = 0
    row.entries.forEach((entry) => {
      const widthIfAdded = currentWidth + entry.size.w + (current.length > 0 ? minGap : 0)
      if (current.length > 0 && widthIfAdded > span) {
        subRows.push(current)
        current = [entry]
        currentWidth = entry.size.w
      } else {
        current.push(entry)
        currentWidth = widthIfAdded
      }
    })
    if (current.length > 0) subRows.push(current)

    const maxDepth = Math.max(...row.entries.map((e) => e.size.d))
    const centerDirection = row.z <= 0 ? 1 : -1 // hàng con sau lùi về phía tâm phòng, không xuyên tường

    subRows.forEach((subRow, subRowIndex) => {
      const totalWidth = subRow.reduce((sum, e) => sum + e.size.w, 0)
      const gap = subRow.length > 1 ? Math.max((span - totalWidth) / (subRow.length - 1), minGap) : 0
      let cursor = -halfW
      const z = clamp(row.z + subRowIndex * (maxDepth + 0.25) * centerDirection, -halfL, halfL)
      subRow.forEach((entry) => {
        entry.x = clamp(cursor + entry.size.w / 2, -halfW, halfW)
        entry.z = z
        cursor += entry.size.w + gap
      })
    })
  })

  // TASK-037: lưới an toàn cuối cùng — việc "lùi hàng con" ở trên chỉ tính khoảng cách bên trong
  // CÙNG một hàng, không biết tới hàng khác đã có món ở gần đó. Với món có `d` (chiều sâu) rất lớn
  // so với các món khác (vd giường 2m), hàng con thứ 2+ có thể bị đẩy lấn sang đúng dải z của một
  // hàng độc lập khác (vd bàn trung tâm ở z=0). Quét từng cặp còn chồng lấn 2D thật sự (không chỉ
  // cùng hàng) và đẩy món có index lớn hơn ra xa thêm theo trục z — lặp vài vòng để ổn định dần
  // khi có 3+ món liên đới, thay vì cố tính đúng ngay 1 lần (đơn giản hơn, đủ dùng cho vài chục món).
  for (let pass = 0; pass < 10; pass++) {
    let anyOverlap = false
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i]
        const b = entries[j]
        const overlapX = Math.min(a.x + a.size.w / 2, b.x + b.size.w / 2) - Math.max(a.x - a.size.w / 2, b.x - b.size.w / 2)
        const overlapZ = Math.min(a.z + a.size.d / 2, b.z + b.size.d / 2) - Math.max(a.z - a.size.d / 2, b.z - b.size.d / 2)
        if (overlapX <= 0 || overlapZ <= 0) continue
        anyOverlap = true
        // TASK-054: đẩy đối xứng cả 2 bên (mỗi bên nửa khoảng cần thiết) thay vì chỉ đẩy 1 bên rồi mới
        // bù — hội tụ ổn định hơn khi 1 món vướng ràng buộc chồng lấn với NHIỀU món khác cùng lúc (mỗi
        // ràng buộc chỉ đòi dịch chuyển 1 nửa thay vì toàn bộ, giảm dao động qua lại giữa các pass; phát
        // hiện qua tự verify: phòng ở mức rộng tối thiểu 1.5m + 5 món vẫn còn sót chồng lấn dù tăng lên
        // 40 pass với cách đẩy 1 bên cũ, do dao động giữa 2 ràng buộc xung đột không hội tụ).
        const push = overlapZ + minGap
        const direction = b.z >= a.z ? 1 : -1
        const half = push / 2
        const desiredA = a.z - half * direction
        const desiredB = b.z + half * direction
        const clampedA = clamp(desiredA, -halfL, halfL)
        const clampedB = clamp(desiredB, -halfL, halfL)
        const shortfallA = Math.abs(desiredA - clampedA)
        const shortfallB = Math.abs(desiredB - clampedB)
        a.z = clampedA
        b.z = clampedB
        // Bên nào bị kẹp mép phòng thì dồn phần thiếu sang bên còn lại nếu bên đó vẫn còn chỗ (phòng
        // quá nhỏ so với tổng số món thì không thể tách rời hoàn toàn, nhưng vẫn giảm tối đa).
        if (shortfallB > 0) a.z = clamp(a.z - direction * shortfallB, -halfL, halfL)
        if (shortfallA > 0) b.z = clamp(b.z + direction * shortfallA, -halfL, halfL)
      }
    }
    if (!anyOverlap) break
  }

  return entries.sort((a, b) => a.index - b.index).map(({ x, z }) => ({ x, z }))
}

/** Kích thước khối 3D xấp xỉ theo nhóm nội thất (mét) — dùng cho hiển thị, không phải kích thước thật. */
export function furnitureSize(category) {
  const key = (category || '').toLowerCase()
  if (key === 'seating') return { w: 1.6, h: 0.8, d: 0.8 }
  if (key === 'table') return { w: 0.9, h: 0.45, d: 0.9 }
  if (key === 'lighting') return { w: 0.3, h: 1.4, d: 0.3 }
  if (key === 'storage') return { w: 1.0, h: 1.6, d: 0.5 }
  // TASK-031: loại đồ có thể tự thêm ngoài 4 category cố định của AI (xem Room3DViewer.jsx#CUSTOM_FURNITURE_PRESETS).
  if (key === 'plant') return { w: 0.4, h: 0.7, d: 0.4 }
  if (key === 'rug') return { w: 1.4, h: 0.02, d: 1.4 }
  if (key === 'tv') return { w: 1.0, h: 0.6, d: 0.15 }
  if (key === 'coatrack') return { w: 0.4, h: 1.7, d: 0.4 }
  // TASK-033: thêm 2 loại đồ nữa cho đa dạng hơn.
  if (key === 'mirror') return { w: 0.5, h: 0.9, d: 0.1 }
  if (key === 'speaker') return { w: 0.35, h: 0.9, d: 0.35 }
  // TASK-037: giường/bàn làm việc — phù hợp phòng ngủ, món to nên cần kích thước thật lớn hơn để tránh chồng lấn.
  if (key === 'bed') return { w: 1.6, h: 0.6, d: 2.0 }
  if (key === 'desk') return { w: 1.2, h: 0.75, d: 0.6 }
  // TASK-038: tủ lạnh/bếp — phù hợp phòng bếp, mở rộng loại đồ ngoài phòng khách/ngủ.
  if (key === 'fridge') return { w: 0.75, h: 1.8, d: 0.7 }
  if (key === 'stove') return { w: 0.9, h: 0.9, d: 0.65 }
  // TASK-039: bồn cầu/bồn tắm — phù hợp phòng tắm. Bồn tắm dài (1.7m) tương tự trường hợp giường ở
  // TASK-037, dùng để verify lại lưới an toàn chống chồng lấn vẫn hoạt động đúng với món "dẹt và dài".
  if (key === 'toilet') return { w: 0.4, h: 0.7, d: 0.65 }
  if (key === 'bathtub') return { w: 0.8, h: 0.55, d: 1.7 }
  // TASK-045: tủ đầu giường (đi cùng giường)/máy giặt (phòng giặt) — mở rộng thêm loại đồ.
  if (key === 'nightstand') return { w: 0.45, h: 0.5, d: 0.4 }
  if (key === 'washer') return { w: 0.6, h: 0.85, d: 0.6 }
  // TASK-050: vòi sen đứng — bổ sung phòng tắm ngoài bồn tắm (TASK-039), khối vuông cao.
  if (key === 'shower') return { w: 0.9, h: 2.0, d: 0.9 }
  // TASK-051: quầy bar bếp + ghế quầy bar — thẩm mỹ bếp/phòng ăn kiểu quầy, khác hẳn bàn ăn thông thường.
  if (key === 'barcounter') return { w: 1.3, h: 0.95, d: 0.55 }
  if (key === 'barstool') return { w: 0.35, h: 0.75, d: 0.35 }
  // TASK-054: gấu bông (đồ chơi trang trí, phòng trẻ em) + quạt trần (neo sàn đơn giản hoá như mọi model
  // gắn tường/trần khác — TASK-018 trở đi, không có toạ độ trần thật).
  if (key === 'teddybear') return { w: 0.35, h: 0.4, d: 0.3 }
  if (key === 'ceilingfan') return { w: 0.9, h: 0.3, d: 0.9 }
  // TASK-057: gối tựa/sách trang trí — món rất nhỏ, đi kèm sofa/kệ sách có sẵn để tăng cảm giác "có người ở".
  if (key === 'pillow') return { w: 0.35, h: 0.15, d: 0.35 }
  if (key === 'books') return { w: 0.3, h: 0.25, d: 0.2 }
  // TASK-059: máy hút mùi (đi cùng bếp)/laptop (đi cùng bàn làm việc) — mở rộng thêm phụ kiện cho 2 loại
  // đồ đã có (stove, desk) thay vì đứng độc lập, món nhỏ nên kích thước khiêm tốn.
  if (key === 'hood') return { w: 0.9, h: 0.3, d: 0.5 }
  if (key === 'laptop') return { w: 0.35, h: 0.05, d: 0.25 }
  // TASK-062: bồn rửa mặt (bổ sung phòng tắm, gắn tường nông) + lò vi sóng/thùng rác (phụ kiện nhỏ đi
  // cùng bếp/phòng khách).
  if (key === 'sink') return { w: 0.55, h: 0.85, d: 0.45 }
  if (key === 'microwave') return { w: 0.5, h: 0.35, d: 0.4 }
  if (key === 'trashcan') return { w: 0.3, h: 0.5, d: 0.3 }
  // TASK-064: máy tính bàn (đi cùng bàn làm việc/laptop)/máy pha cà phê (phụ kiện bếp) — cả 2 nhỏ gọn.
  if (key === 'computer') return { w: 0.4, h: 0.35, d: 0.15 }
  if (key === 'coffeemachine') return { w: 0.3, h: 0.4, d: 0.3 }
  // TASK-066: radio (đồ trang trí nhỏ)/máy nướng bánh mì (phụ kiện bếp nhỏ gọn).
  if (key === 'radio') return { w: 0.3, h: 0.25, d: 0.2 }
  if (key === 'toaster') return { w: 0.25, h: 0.2, d: 0.2 }
  // TASK-068: máy xay sinh tố (nhỏ gọn)/bồn rửa bát (gắn tường, có tủ dưới nên chiều sâu lớn hơn bồn
  // rửa mặt "sink" của phòng tắm).
  if (key === 'blender') return { w: 0.25, h: 0.4, d: 0.25 }
  if (key === 'kitchensink') return { w: 0.7, h: 0.85, d: 0.55 }
  // TASK-072: bàn phím/chuột — phụ kiện rất nhỏ, đặt trên mặt bàn nên chiều cao thấp.
  if (key === 'keyboard') return { w: 0.35, h: 0.03, d: 0.15 }
  if (key === 'mouse') return { w: 0.08, h: 0.04, d: 0.12 }
  // TASK-074: thùng carton — kích thước hộp chuyển nhà điển hình.
  if (key === 'box') return { w: 0.45, h: 0.4, d: 0.4 }
  return { w: 0.8, h: 0.8, d: 0.8 }
}
