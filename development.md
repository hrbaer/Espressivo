# Espressivo

## Gamepad

### Assignments

How to automatically assign gamepad button to musical elements?

#### Input

One or more gamepads or other devices

- Acceleration sensor
- Sticks (X, Y)
- Triggers
- Buttons

#### Output

- Tempo
- Velocity
  - Overall
  - Per staff
  - Per Voice
- Aritculation
  - Overall
  - Per staff
  - Per voice

#### Design
One gamepad can handle up to 4 staffs.

##### Acceleration Sensor
- Primarily used for tempo and and overall velocity

##### Sticks
- Velocity per staff and or voice

##### Triggers
- Primarily used for articulation

#### Examples

One gamepad (with acceleration sensor) for a grand staff:

- Acceleration sensor to control tempo and overall velocity
- Left stick to control velocity of lower staff
- Right stick to control velocity of upper staff
- Horizontal and vertical direction to control velocity of the first two voices
- Alternatively, each direction (top, right, bottom, left) to emphasize the velocity of four voices
- Trigger to control the articulation of the upper and the lower staff

One gamepad (without acceleration sensor) for a grand staff:

- Right stick to control tempo and global velocity
- Left stick to control two voices of each staff

Two gamepads for a grand staff

- The first gamepad controls tempo and global veloctiy
- Each gamepad controls on staff
- Atlernatively, the second gamepad controls both staffs

