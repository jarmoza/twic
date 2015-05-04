from math import sqrt
from random import randrange

class Color_Utils:

    max_color_distance = sqrt(255 * 255 * 3)
    close_color_percentage = int(max_color_distance * 0.025)

    @staticmethod
    def Get_UniqueColorList(list_size):

        # Build a color list of unique colors
        color_list = []
        color_rgbtuple_list = []

        for index in range(list_size):
            rgb_tuple = Color_Utils.Get_RandomRGB()
            hex_value = Color_Utils.RGB_to_Hex(rgb_tuple)
            while hex_value in color_list or Color_Utils.Is_CloseRGB_to_ListRGB(rgb_tuple, color_rgbtuple_list):
                rgb_tuple = Color_Utils.Get_RandomRGB(True)
                hex_value = Color_Utils.RGB_to_Hex(rgb_tuple)
            color_list.append(hex_value)
            color_rgbtuple_list.append(rgb_tuple)

        return color_list

    @staticmethod
    def Get_RandomRGB(light = False):

        has_set_on_or_off = False
        components = []
        lightest_component = 32 if light else 0
        component_lowering = 0

        for index in range(3):

            component = randrange(lightest_component,255,2) * 2
            if component > 255:
                if not has_set_on_or_off:
                    hilo = randrange(1,2,2)
                    component = 255 if 1 == hilo else lightest_component
                else:
                    component = randrange(64,192,2)
                if 255 == component or lightest_component == component:
                    has_set_on_or_off = True
            components.append(component)

        # - (0 if (components[2] < component_lowering) else component_lowering)
        return (components[0], components[1], components[2])

    @staticmethod
    def Is_CloseRGB(rgb_one, rgb_two):

        rcomp = (rgb_two[0] - rgb_one[0])
        gcomp = (rgb_two[1] - rgb_one[1])
        bcomp = (rgb_two[2] - rgb_two[2])

        distance = sqrt((rcomp * rcomp) + (gcomp * gcomp) + (bcomp * bcomp))

        return distance < Color_Utils.close_color_percentage

    @staticmethod
    def Is_CloseRGB_to_ListRGB(rgb, rgb_list):

        is_close = False
        for rgbcomp in rgb_list:
            if Color_Utils.Is_CloseRGB(rgb, rgbcomp):
                is_close = True
                break

        return is_close

    @staticmethod
    def RGB_to_Hex(rgb):

        return '#%02x%02x%02x' % rgb

