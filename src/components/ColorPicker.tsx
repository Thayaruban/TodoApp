import { CSSProperties, useCallback, useContext, useEffect, useRef, useState } from "react";
import { ColorElement, ColorPalette, DialogBtn } from "../styles";
import styled from "@emotion/styled";
import {
  AddRounded,
  ColorizeRounded,
  Done,
  ExpandMoreRounded,
  InfoRounded,
} from "@mui/icons-material";
import { getFontColor } from "../utils";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Popover,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@emotion/react";
import { UserContext } from "../contexts/UserContext";
import toast from "react-hot-toast";

interface ColorPickerProps {
  color: string;
  onColorChange: (newColor: string) => void;
  width?: CSSProperties["width"];
  fontColor?: CSSProperties["color"];
  label?: string;
}

/**
 * Custom Color Picker component for selecting colors.
 */

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onColorChange,
  width,
  fontColor,
  label,
}) => {
  const { user, setUser } = useContext(UserContext);
  const [selectedColor, setSelectedColor] = useState<string>(color);
  const [accordionExpanded, setAccordionExpanded] = useState<boolean>(false);

  const [popoverOpen, setPopoverOpen] = useState<boolean[]>(
    Array(user.colorList.length).fill(false)
  );
  const [openAddDialog, setOpenAddDialog] = useState<boolean>(false);
  const [addColorVal, setAddColorVal] = useState<string>("#000000");
  const colorElementRefs = useRef<Array<HTMLElement | null>>([]);

  const theme = useTheme();

  const isHexColor = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value);

  useEffect(() => {
    // Update the selected color when the color prop changes
    setSelectedColor(color);
  }, [color]);

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedColor(color);
      onColorChange(color);
    },
    [onColorChange]
  );

  // Check if the current color is a valid hex color and update it if not
  useEffect(() => {
    if (!isHexColor(color)) {
      handleColorChange(theme.primary);
      setSelectedColor(theme.primary);
      console.error("Invalid hex color " + color);
    }
  }, [color, handleColorChange, theme.primary]);

  const handleAccordionChange = (
    _event: React.SyntheticEvent<Element, Event>,
    isExpanded: boolean
  ) => setAccordionExpanded(isExpanded);

  const togglePopover = (index: number) => {
    const newPopoverOpen = [...popoverOpen];
    newPopoverOpen[index] = !newPopoverOpen[index];
    setPopoverOpen(newPopoverOpen);
  };

  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setAddColorVal("#000000");
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddColorVal(e.target.value as string);

  const handleAddColor = () => {
    if (!user.colorList.includes(addColorVal)) {
      setUser({ ...user, colorList: [...user.colorList, addColorVal] });
      toast.success((t) => (
        <div onClick={() => toast.dismiss(t.id)}>
          Added {addColorVal.toUpperCase()} to your color list.
        </div>
      ));
      handleAddDialogClose();
    } else {
      toast.error((t) => (
        <div onClick={() => toast.dismiss(t.id)}>Color is already in color list.</div>
      ));
    }
  };

  const handleDeleteColor = () => {
    setPopoverOpen(Array(user.colorList.length).fill(false));
    setUser({
      ...user,
      colorList: user.colorList.filter((listColor) => listColor !== color),
    });
  };

  return (
    <>
      <StyledAccordion
        onChange={handleAccordionChange}
        sx={{
          width: width,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRounded sx={{ color: fontColor || ColorPalette.fontLight }} />}
          sx={{ fontWeight: 500 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {!accordionExpanded && <AccordionPreview clr={selectedColor} />}
            <span style={{ color: fontColor || ColorPalette.fontLight }}>{label || "Color"}</span>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <ColorPreview maxWidth={width || 400} clr={selectedColor}>
            {selectedColor.toUpperCase()}
          </ColorPreview>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              maxWidth: width || 400,
            }}
          >
            <Grid container spacing={1} maxWidth={width || 400} m={1}>
              {[theme.primary, ...user.colorList].map((color, index) => (
                <Grid item key={color}>
                  <ColorElement
                    ref={(element) => (colorElementRefs.current[index] = element)}
                    id={`color-element-${index}`}
                    clr={color}
                    aria-label={`Select color - ${color}`}
                    onClick={() => {
                      handleColorChange(color);
                      if (selectedColor === color && color !== theme.primary) {
                        togglePopover(index);
                      }
                    }}
                  >
                    {color === selectedColor && <Done />}
                  </ColorElement>

                  <Popover
                    open={popoverOpen[index]}
                    onClose={() => togglePopover(index)}
                    anchorEl={colorElementRefs.current[index]}
                    anchorOrigin={{
                      vertical: "top",
                      horizontal: "center",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "center",
                    }}
                    slotProps={{
                      paper: {
                        sx: {
                          background: "transparent",
                          boxShadow: "none",
                        },
                      },
                    }}
                  >
                    <div>
                      <DeleteColorBtn onClick={handleDeleteColor}>Delete</DeleteColorBtn>
                    </div>
                  </Popover>
                </Grid>
              ))}
              <Tooltip title="Add new color">
                <Grid item>
                  <ColorElement
                    clr="transparent"
                    style={{ border: "2px solid", color: fontColor || ColorPalette.fontLight }}
                    onClick={() => setOpenAddDialog(true)}
                  >
                    <AddRounded style={{ fontSize: "38px" }} />
                  </ColorElement>
                </Grid>
              </Tooltip>
            </Grid>
          </div>
          <StyledInfo clr={fontColor || ColorPalette.fontLight}>
            <InfoRounded fontSize="small" /> Double tap to remove color from list
          </StyledInfo>
        </AccordionDetails>
      </StyledAccordion>
      <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
        <DialogTitle>Add new color</DialogTitle>
        <DialogContent>
          <ColorPreview maxWidth={500} clr={addColorVal}>
            {addColorVal.toUpperCase()}
          </ColorPreview>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "18px",
            }}
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                document.getElementById("colorInput")?.click();
              }}
            >
              <ColorizeRounded /> &nbsp; Choose color
            </Button>
            <input
              id="colorInput"
              type="color"
              value={addColorVal}
              onChange={handlePickerChange}
              style={{
                position: "absolute",
                top: "100%",
                left: "32px",
                zIndex: 999,
                opacity: 0,
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <DialogBtn onClick={handleAddDialogClose}>Cancel</DialogBtn>
          <DialogBtn
            onClick={() => {
              onColorChange(addColorVal);
              handleAddDialogClose();
            }}
          >
            <ColorizeRounded /> &nbsp; Set
          </DialogBtn>
          <DialogBtn onClick={handleAddColor}>
            <AddRounded /> &nbsp; Add
          </DialogBtn>
        </DialogActions>
      </Dialog>
    </>
  );
};

const StyledAccordion = styled(Accordion)`
  background: #ffffff18;
  border-radius: 16px !important;
  border: 1px solid #0000003a;
  box-shadow: none;
  padding: 6px 0;
  margin: 8px 0;
`;

const AccordionPreview = styled.div<{ clr: string }>`
  width: 24px;
  height: 24px;
  background: ${({ clr }) => clr};
  border-radius: 8px;
  transition: 0.3s background;
`;

const ColorPreview = styled(Grid)<{ clr: string }>`
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${({ clr }) => clr};
  color: ${({ clr }) => getFontColor(clr)};
  padding: 8px;
  border-radius: 100px;
  transition: 0.3s all;
  font-weight: 600;
  border: 2px solid #ffffffab;
`;

const DeleteColorBtn = styled.button`
  border: none;
  outline: none;
  background-color: #141431dd;
  color: #ff4e4e;
  font-weight: 500;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 10px;
  backdrop-filter: blur(6px);
  @media (max-width: 768px) {
    padding: 6px 10px;
  }
`;

const StyledInfo = styled.span<{ clr: string }>`
  color: ${({ clr }) => clr};
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  margin-left: 4px;
  font-size: 14px;
`;
