export default (): string => "module GraphQL.Operations.CanonicalAST exposing (..)\n\nimport Dict exposing (Dict)\nimport Elm\nimport Elm.Annotation as Type\nimport Elm.Op\nimport Gen.GraphQL.Engine as Engine\nimport Gen.GraphQL.Operations.AST as GenAST\nimport Gen.GraphQL.Operations.CanonicalAST as GenCan\nimport Gen.GraphQL.Schema as GenSchema\nimport Gen.String\nimport GraphQL.Operations.AST as AST\nimport GraphQL.Schema\n\n\ntype alias Document =\n    { definitions : List Definition\n    , fragments : List Fragment\n    }\n\n\ntype Definition\n    = Operation OperationDetails\n\n\ntype alias OperationDetails =\n    { operationType : OperationType\n    , name : Maybe Name\n    , variableDefinitions : List VariableDefinition\n    , directives : List Directive\n    , fields : List Field\n    , fragmentsUsed :\n        -- NOTE: WE capture alongsideOtherFields in order to inform code generation\n        -- If the fragment is selected by itself, then we can generate a record specifically for that fragment\n        -- otherwise, we only generate stuff for it's downstream stuff.\n        List\n            { fragment : Fragment\n            , alongsideOtherFields : Bool\n            }\n    }\n\n\ntype OperationType\n    = Query\n    | Mutation\n\n\ntype alias Directive =\n    { name : Name\n    , arguments : List Argument\n    }\n\n\ntype alias Argument =\n    AST.Argument\n\n\ntype alias VariableDefinition =\n    { variable : Variable\n    , type_ : AST.Type\n    , defaultValue : Maybe AST.Value\n    , schemaType : GraphQL.Schema.Type\n    }\n\n\ntype alias Variable =\n    { name : Name\n    }\n\n\n{-| A selection is a few different pieces\n\n    myAlias: fieldName(args) @directive {\n        # selected fields\n    }\n\n  - name -> the field name in the schema\n  - alias\\_ -> the alias provided in the query\n  - globalAlias ->\n    The name that's guaranteed to be unique for the query.\n    This is used to generate record types for the results of an operation.\n\n-}\ntype Field\n    = Field FieldDetails\n    | Frag FragmentDetails\n\n\ntype alias FieldDetails =\n    { alias_ : Maybe Name\n    , name : Name\n    , globalAlias : Name\n    , selectsOnlyFragment :\n        Maybe\n            { importFrom : List String\n            , name : String\n            }\n    , arguments : List Argument\n    , directives : List Directive\n    , wrapper : GraphQL.Schema.Wrapped\n    , selection : Selection\n    }\n\n\ntype alias FragmentDetails =\n    { fragment : Fragment\n    , directives : List Directive\n    }\n\n\ntype alias Fragment =\n    { name : Name\n    , importFrom : List String\n    , typeCondition : Name\n    , usedVariables : List ( String, GraphQL.Schema.Type )\n    , fragmentsUsed :\n        List Name\n    , directives : List Directive\n    , selection : FragmentSelection\n    }\n\n\ntype FragmentSelection\n    = FragmentObject\n        { selection : List Field\n        }\n    | FragmentUnion FieldVariantDetails\n    | FragmentInterface FieldVariantDetails\n\n\ntype Selection\n    = FieldScalar GraphQL.Schema.Type\n    | FieldEnum FieldEnumDetails\n    | FieldObject (List Field)\n    | FieldUnion FieldVariantDetails\n    | FieldInterface FieldVariantDetails\n\n\nisTypeNameSelection : Field -> Bool\nisTypeNameSelection field =\n    case field of\n        Field details ->\n            nameToString details.name == \"__typename\"\n\n        Frag frag ->\n            False\n\n\ntype alias FieldVariantDetails =\n    { selection : List Field\n    , variants : List VariantCase\n    , remainingTags :\n        List\n            { tag : Name\n            , globalAlias : Name\n            }\n    }\n\n\ntype alias FieldInterfaceDetails =\n    { selection : List Field\n    , variants : List VariantCase\n    , remainingTags :\n        List\n            { tag : Name\n            , globalAlias : Name\n            }\n    }\n\n\ntype alias VariantCase =\n    { tag : Name\n    , globalTagName : Name\n    , globalDetailsAlias : Name\n    , directives : List Directive\n    , selection : List Field\n    }\n\n\ntype alias FieldEnumDetails =\n    { enumName : String\n    , values : List { name : String, description : Maybe String }\n    }\n\n\ntype Name\n    = Name String\n\n\ngetAliasedName : FieldDetails -> String\ngetAliasedName details =\n    nameToString (Maybe.withDefault details.name details.alias_)\n\n\nnameToString : Name -> String\nnameToString (Name str) =\n    str\n\n\n\n{- To String -}\n\n\n{-| -}\ntoString : Definition -> String\ntoString (Operation def) =\n    let\n        opName =\n            case def.name of\n                Nothing ->\n                    \"\"\n\n                Just (Name str) ->\n                    str\n\n        variableDefinitions =\n            case def.variableDefinitions of\n                [] ->\n                    \"\"\n\n                vars ->\n                    let\n                        renderedVars =\n                            foldToString \", \"\n                                (\\var ->\n                                    \"$\"\n                                        ++ nameToString var.variable.name\n                                        ++ \": \"\n                                        ++ typeToString (getWrapper var.type_ (Val { required = True })) var.type_\n                                )\n                                vars\n                    in\n                    \"(\" ++ renderedVars ++ \")\"\n    in\n    operationName def.operationType\n        ++ \" \"\n        ++ opName\n        ++ variableDefinitions\n        ++ \" \"\n        ++ brackets\n            (foldToString \"\\n\" fieldToString def.fields)\n\n\n{-| Only render the fields of the query, but with no outer brackets\n-}\noperationLabel : Definition -> Maybe String\noperationLabel (Operation def) =\n    case def.name of\n        Nothing ->\n            Nothing\n\n        Just (Name str) ->\n            Just str\n\n\n{-| Only render the fields of the query, but with no outer brackets\n-}\ntoStringFields : Definition -> String\ntoStringFields (Operation def) =\n    foldToString \"\\n\" fieldToString def.fields\n\n\nfieldToString : Field -> String\nfieldToString field =\n    case field of\n        Field details ->\n            aliasedName details\n                ++ renderArguments details.arguments\n                ++ selectionToString details.selection\n\n        Frag frag ->\n            \"...\" ++ nameToString frag.fragment.name\n\n\nselectionToString : Selection -> String\nselectionToString selection =\n    case selection of\n        FieldObject fields ->\n            selectionGroupToString fields\n\n        FieldUnion details ->\n            brackets\n                (foldToString \"\\n\" fieldToString details.selection\n                    ++ (if not (List.isEmpty details.selection && List.isEmpty details.variants) then\n                            \"\\n\"\n\n                        else\n                            \"\"\n                       )\n                    ++ foldToString \"\\n\" variantFragmentToString details.variants\n                )\n\n        FieldScalar details ->\n            \"\"\n\n        FieldEnum details ->\n            \"\"\n\n        FieldInterface details ->\n            brackets\n                (foldToString \"\\n\" fieldToString details.selection\n                    ++ (if not (List.isEmpty details.selection && List.isEmpty details.variants) then\n                            \"\\n\"\n\n                        else\n                            \"\"\n                       )\n                    ++ foldToString \"\\n\" variantFragmentToString details.variants\n                )\n\n\nvariantFragmentToString : VariantCase -> String\nvariantFragmentToString instance =\n    \"... on \"\n        ++ nameToString instance.tag\n        ++ \" \"\n        ++ brackets (foldToString \"\\n\" fieldToString instance.selection)\n\n\nselectionGroupToString : List Field -> String\nselectionGroupToString selection =\n    case selection of\n        [] ->\n            \"\"\n\n        _ ->\n            \" \"\n                ++ brackets (foldToString \"\\n\" fieldToString selection)\n\n\nrenderArguments : List Argument -> String\nrenderArguments args =\n    case args of\n        [] ->\n            \"\"\n\n        _ ->\n            \"(\"\n                ++ foldToString \"\\n\" argToString args\n                ++ \")\"\n\n\nargToString : Argument -> String\nargToString arg =\n    AST.nameToString arg.name ++ \": \" ++ argValToString arg.value\n\n\nargValToString : AST.Value -> String\nargValToString val =\n    case val of\n        AST.Str str ->\n            \"\\\"\" ++ str ++ \"\\\"\"\n\n        AST.Integer int ->\n            String.fromInt int\n\n        AST.Decimal dec ->\n            String.fromFloat dec\n\n        AST.Boolean True ->\n            \"true\"\n\n        AST.Boolean False ->\n            \"false\"\n\n        AST.Null ->\n            \"null\"\n\n        AST.Enum (AST.Name str) ->\n            str\n\n        AST.Var var ->\n            \"$\" ++ AST.nameToString var.name\n\n        AST.Object keyVals ->\n            brackets\n                (foldToString \", \"\n                    (\\( key, innerVal ) ->\n                        AST.nameToString key ++ \": \" ++ argValToString innerVal\n                    )\n                    keyVals\n                )\n\n        AST.ListValue vals ->\n            \"[\"\n                ++ foldToString \", \" argValToString vals\n                ++ \"]\"\n\n\naliasedName : FieldDetails -> String\naliasedName details =\n    case details.alias_ of\n        Nothing ->\n            nameToString details.name\n\n        Just alias_ ->\n            nameToString alias_ ++ \": \" ++ nameToString details.name\n\n\nfoldToString : String -> (a -> String) -> List a -> String\nfoldToString delimiter fn vals =\n    List.foldl\n        (\\var rendered ->\n            let\n                val =\n                    fn var\n            in\n            case rendered of\n                \"\" ->\n                    val\n\n                _ ->\n                    val ++ delimiter ++ rendered\n        )\n        \"\"\n        vals\n\n\noperationName : OperationType -> String\noperationName opType =\n    case opType of\n        Query ->\n            \"query\"\n\n        Mutation ->\n            \"mutation\"\n\n\nbrackets : String -> String\nbrackets str =\n    \"{\" ++ str ++ \"}\"\n\n\ntype Wrapper\n    = InList { required : Bool } Wrapper\n    | Val { required : Bool }\n\n\n{-|\n\n    Type ->\n        Required Val\n\n    Nullable Type ->\n        Val\n\n-}\ngetWrapper : AST.Type -> Wrapper -> Wrapper\ngetWrapper t wrap =\n    case t of\n        AST.Type_ _ ->\n            wrap\n\n        AST.List_ inner ->\n            getWrapper inner (InList { required = True } wrap)\n\n        AST.Nullable inner ->\n            case wrap of\n                Val { required } ->\n                    getWrapper inner (Val { required = False })\n\n                InList { required } wrapper ->\n                    getWrapper inner (InList { required = False } wrapper)\n\n\ntypeToString : Wrapper -> AST.Type -> String\ntypeToString wrapper t =\n    case t of\n        AST.Type_ (AST.Name str) ->\n            unwrap wrapper str\n\n        AST.List_ inner ->\n            typeToString wrapper inner\n\n        AST.Nullable inner ->\n            typeToString wrapper inner\n\n\nunwrap : Wrapper -> String -> String\nunwrap wrapper str =\n    case wrapper of\n        Val { required } ->\n            if required then\n                str ++ \"!\"\n\n            else\n                str\n\n        InList { required } inner ->\n            if required then\n                unwrap inner (\"[\" ++ str ++ \"!]\")\n\n            else\n                unwrap inner (\"[\" ++ str ++ \"]\")\n\n\n\n{- TO RENDERER -}\n\n\n{-| We want to render a string of this, but with a `version`\n\nThe version is an Int, which represents if there are other queries batched with it.\n\n-}\ntoRendererExpression : Elm.Expression -> Definition -> Elm.Expression\ntoRendererExpression version (Operation def) =\n    initCursor version\n        |> renderFields def.fields\n        |> commit\n        |> (\\cursor ->\n                let\n                    frags =\n                        def.fragmentsUsed\n                            |> List.map .fragment\n                            |> deduplicateFragments\n                in\n                case frags of\n                    [] ->\n                        Maybe.withDefault (Elm.string \"\") cursor.exp\n\n                    _ ->\n                        let\n                            renderedFragments =\n                                frags\n                                    |> List.map renderFragment\n                                    |> String.join \"\\n\"\n                        in\n                        Elm.Op.append (Maybe.withDefault (Elm.string \"\") cursor.exp)\n                            (Elm.string renderedFragments)\n           )\n\n\ndeduplicateFragments : List Fragment -> List Fragment\ndeduplicateFragments frags =\n    frags\n        |> List.map\n            (\\f ->\n                ( nameToString f.name\n                , f\n                )\n            )\n        |> Dict.fromList\n        |> Dict.values\n\n\nrenderFragment : Fragment -> String\nrenderFragment frag =\n    let\n        selection =\n            case frag.selection of\n                FragmentObject obj ->\n                    selectionGroupToString obj.selection\n\n                FragmentUnion union ->\n                    foldToString \"\\n\" fieldToString union.selection\n                        ++ (if not (List.isEmpty union.selection && List.isEmpty union.variants) then\n                                \"\\n\"\n\n                            else\n                                \"\"\n                           )\n                        ++ foldToString \"\\n\" variantFragmentToString union.variants\n\n                FragmentInterface interface ->\n                    -- selectionGroupToString interface.selection\n                    foldToString \"\\n\" fieldToString interface.selection\n                        ++ (if not (List.isEmpty interface.selection && List.isEmpty interface.variants) then\n                                \"\\n\"\n\n                            else\n                                \"\"\n                           )\n                        ++ foldToString \"\\n\" variantFragmentToString interface.variants\n    in\n    (\"fragment \" ++ nameToString frag.name ++ \" on \" ++ nameToString frag.typeCondition ++ \" {\")\n        ++ selection\n        ++ \" }\"\n\n\nrenderFields fields cursor =\n    List.foldr\n        (\\sel ( afterFirst, c ) ->\n            ( True\n            , c\n                |> addString\n                    (if afterFirst then\n                        \"\\n\"\n\n                     else\n                        \"\"\n                    )\n                |> renderField sel\n            )\n        )\n        ( False, cursor )\n        fields\n        |> Tuple.second\n\n\ninitCursor : Elm.Expression -> RenderingCursor\ninitCursor version =\n    { string = \"\"\n    , exp = Nothing\n    , depth = 0\n    , version = version\n    }\n\n\ntype alias RenderingCursor =\n    { string : String\n    , exp : Maybe Elm.Expression\n    , depth : Int\n    , version : Elm.Expression\n    }\n\n\naddLevelToCursor : RenderingCursor -> RenderingCursor\naddLevelToCursor cursor =\n    { cursor | depth = cursor.depth + 1 }\n\n\nremoveLevelToCursor : RenderingCursor -> RenderingCursor\nremoveLevelToCursor cursor =\n    { cursor | depth = cursor.depth - 1 }\n\n\ncommit : RenderingCursor -> RenderingCursor\ncommit cursor =\n    case cursor.string of\n        \"\" ->\n            cursor\n\n        _ ->\n            { cursor\n                | string = \"\"\n                , exp =\n                    case cursor.exp of\n                        Nothing ->\n                            Just (Elm.string cursor.string)\n\n                        Just existing ->\n                            Just\n                                (Elm.Op.append existing (Elm.string cursor.string))\n\n                -- (Gen.String.call_.append existing (Elm.string cursor.string))\n                -- (Elm.string cursor.string\n                --     |> Elm.Op.pipe\n                --         (Elm.apply Gen.String.values_.append [ existing ])\n                -- )\n            }\n\n\naddString : String -> RenderingCursor -> RenderingCursor\naddString str cursor =\n    case str of\n        \"\" ->\n            cursor\n\n        _ ->\n            { cursor | string = cursor.string ++ str }\n\n\naddExp : Elm.Expression -> RenderingCursor -> RenderingCursor\naddExp new cursor =\n    let\n        committed =\n            commit cursor\n    in\n    { committed\n        | exp =\n            case committed.exp of\n                Nothing ->\n                    Just new\n\n                Just existing ->\n                    Just\n                        (Elm.Op.append existing new)\n    }\n\n\nrenderField : Field -> RenderingCursor -> RenderingCursor\nrenderField field cursor =\n    case field of\n        Frag frag ->\n            cursor\n                |> addString (\"\\n...\" ++ nameToString frag.fragment.name)\n\n        Field details ->\n            cursor\n                |> aliasedNameExp details\n                |> renderArgumentsExp details.arguments\n                -- Do we include client side directives?\n                -- For now, no.\n                |> renderSelection details.selection\n\n\nrenderSelection : Selection -> RenderingCursor -> RenderingCursor\nrenderSelection selection cursor =\n    case selection of\n        FieldScalar details ->\n            cursor\n\n        FieldEnum details ->\n            cursor\n\n        FieldObject fields ->\n            cursor\n                |> addString \" {\"\n                |> addLevelToCursor\n                |> renderFields fields\n                |> removeLevelToCursor\n                |> addString \" }\"\n\n        FieldUnion details ->\n            cursor\n                |> addString \" {\"\n                |> addLevelToCursor\n                |> renderFields details.selection\n                |> removeLevelToCursor\n                |> addString\n                    (if not (List.isEmpty details.selection && List.isEmpty details.variants) then\n                        \"\\n\"\n\n                     else\n                        \"\"\n                    )\n                |> addLevelToCursor\n                |> (\\currentCursor ->\n                        List.foldr renderVariant currentCursor details.variants\n                   )\n                |> removeLevelToCursor\n                |> addString \" }\"\n\n        FieldInterface details ->\n            cursor\n                |> addString \" {\"\n                |> addLevelToCursor\n                |> renderFields details.selection\n                |> removeLevelToCursor\n                |> addString\n                    (if not (List.isEmpty details.selection && List.isEmpty details.variants) then\n                        \"\\n\"\n\n                     else\n                        \"\"\n                    )\n                |> addLevelToCursor\n                |> (\\currentCursor ->\n                        List.foldr renderVariant currentCursor details.variants\n                   )\n                |> removeLevelToCursor\n                |> addString \" }\"\n\n\nrenderVariant : VariantCase -> RenderingCursor -> RenderingCursor\nrenderVariant instance cursor =\n    cursor\n        |> addString (\"\\n... on \" ++ nameToString instance.tag ++ \" {\")\n        |> addLevelToCursor\n        |> renderFields instance.selection\n        |> removeLevelToCursor\n        |> addString \"}\"\n\n\naliasedNameExp : { a | alias_ : Maybe Name, name : Name } -> RenderingCursor -> RenderingCursor\naliasedNameExp details cursor =\n    if cursor.depth == 0 then\n        case details.alias_ of\n            Nothing ->\n                cursor\n                    |> addExp\n                        (Engine.call_.versionedAlias\n                            cursor.version\n                            (Elm.string (nameToString details.name))\n                        )\n\n            Just alias_ ->\n                cursor\n                    |> addExp\n                        (Engine.call_.versionedName\n                            cursor.version\n                            (Elm.string (nameToString alias_))\n                        )\n                    |> addString (\": \" ++ nameToString details.name)\n\n    else\n        case details.alias_ of\n            Nothing ->\n                cursor\n                    |> addString (nameToString details.name)\n\n            Just alias_ ->\n                cursor\n                    |> addString\n                        (nameToString alias_ ++ \": \" ++ nameToString details.name)\n\n\nrenderArgumentsExp : List Argument -> RenderingCursor -> RenderingCursor\nrenderArgumentsExp args cursor =\n    case args of\n        [] ->\n            cursor\n\n        _ ->\n            List.foldr\n                (\\arg ( afterFirst, curs ) ->\n                    ( True\n                    , curs\n                        |> addString\n                            (if afterFirst then\n                                \", \"\n\n                             else\n                                \"\"\n                            )\n                        |> addString (AST.nameToString arg.name ++ \": \")\n                        |> addArgValue arg.value\n                    )\n                )\n                ( False\n                , cursor\n                    |> addString \" (\"\n                )\n                args\n                |> Tuple.second\n                |> addString \")\"\n\n\naddArgValue : AST.Value -> RenderingCursor -> RenderingCursor\naddArgValue val cursor =\n    case val of\n        AST.Str str ->\n            cursor\n                |> addString (\"\\\"\" ++ str ++ \"\\\"\")\n\n        AST.Integer int ->\n            cursor\n                |> addString (String.fromInt int)\n\n        AST.Decimal dec ->\n            cursor\n                |> addString\n                    (String.fromFloat dec)\n\n        AST.Boolean True ->\n            cursor\n                |> addString \"true\"\n\n        AST.Boolean False ->\n            cursor\n                |> addString \"false\"\n\n        AST.Null ->\n            cursor\n                |> addString \"null\"\n\n        AST.Enum (AST.Name str) ->\n            cursor\n                |> addString str\n\n        AST.Var var ->\n            cursor\n                |> addExp\n                    (Engine.call_.versionedName\n                        cursor.version\n                        (Elm.string (\"$\" ++ AST.nameToString var.name))\n                    )\n\n        AST.Object keyVals ->\n            List.foldr\n                (\\( key, innerVal ) ( afterFirst, curs ) ->\n                    ( True\n                    , curs\n                        |> addString\n                            (if afterFirst then\n                                \", \"\n\n                             else\n                                \"\"\n                            )\n                        |> addString (AST.nameToString key ++ \": \")\n                        |> addArgValue innerVal\n                    )\n                )\n                ( False\n                , cursor\n                    |> addString \"{\"\n                )\n                keyVals\n                |> Tuple.second\n                |> addString \"}\"\n\n        AST.ListValue vals ->\n            List.foldr\n                (\\innerVal ( afterFirst, curs ) ->\n                    ( True\n                    , curs\n                        |> addString\n                            (if afterFirst then\n                                \", \"\n\n                             else\n                                \"\"\n                            )\n                        |> addArgValue innerVal\n                    )\n                )\n                ( False\n                , cursor\n                    |> addString \"[\"\n                )\n                vals\n                |> Tuple.second\n                |> addString \"]\"\n"